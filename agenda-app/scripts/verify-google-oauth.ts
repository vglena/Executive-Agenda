/**
 * verify-google-oauth.ts — Smoke test F3-01: Google OAuth 2.0 + token store
 *
 * Tests que NO requieren credenciales de Google reales:
 *  1. Encriptación/desencriptación de tokens (AES-256-GCM)
 *  2. Encriptación sin clave (fallback base64)
 *  3. isGoogleConfigured() devuelve false sin variables de entorno
 *  4. GET /api/calendar/status sin auth → 401
 *  5. GET /api/calendar/status con auth → responde (connected o not configured)
 *  6. POST /api/calendar/disconnect sin auth → 401
 *  7. GET /api/auth/google sin auth → 401
 *  8. GET /api/auth/google con auth y sin config → 503
 *  9. GET /api/auth/google/callback sin code/state → 400
 */

import { encryptTokens, decryptTokens, type GoogleTokenData } from '../lib/integrations/calendar/token-crypto'
import { isGoogleConfigured } from '../lib/integrations/calendar/google-oauth'

const BASE_URL = `http://localhost:${process.env.PORT ?? 3000}`
let passed = 0
let failed = 0

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ❌ ${name}`)
    console.error(`     ${(err as Error).message}`)
    failed++
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

async function main() {
  console.log('\n=== F3-01: Google OAuth 2.0 + Token Store — Smoke Test ===\n')

  // ── Unidad: token-crypto ──────────────────────────────────────────────────

  const sampleTokens: GoogleTokenData = {
    access_token: 'ya29.test_access_token',
    refresh_token: '1//test_refresh_token_long_value',
    expiry_date: Date.now() + 3600 * 1000,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  }

  await test('[token-crypto] Sin clave: roundtrip base64', async () => {
    // Asegurarse de que no hay clave configurada en este contexto de test
    const original = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
    delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY

    const encrypted = encryptTokens(sampleTokens)
    const decrypted = decryptTokens(encrypted)

    assert(decrypted.access_token === sampleTokens.access_token, 'access_token no coincide')
    assert(decrypted.refresh_token === sampleTokens.refresh_token, 'refresh_token no coincide')
    assert(decrypted.expiry_date === sampleTokens.expiry_date, 'expiry_date no coincide')

    // Restaurar si había valor
    if (original !== undefined) process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = original
  })

  await test('[token-crypto] Con clave AES-256-GCM: roundtrip seguro', async () => {
    const key = Buffer.from('01234567890123456789012345678901').toString('base64') // 32 bytes
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = key

    const encrypted = encryptTokens(sampleTokens)
    // El formato debe ser iv:tag:ciphertext (3 partes hex separadas por ':')
    const parts = encrypted.split(':')
    assert(parts.length === 3, `Formato incorrecto: ${parts.length} partes`)

    const decrypted = decryptTokens(encrypted)
    assert(decrypted.access_token === sampleTokens.access_token, 'access_token no coincide')
    assert(decrypted.refresh_token === sampleTokens.refresh_token, 'refresh_token no coincide')

    delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  })

  await test('[token-crypto] Tamper detection — tag corrupto → lanza', async () => {
    const key = Buffer.from('01234567890123456789012345678901').toString('base64')
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = key

    const encrypted = encryptTokens(sampleTokens)
    const [iv, tag, cipher] = encrypted.split(':')
    // Corromper el tag
    const badTag = tag.slice(0, -2) + 'ff'
    const tampered = [iv, badTag, cipher].join(':')

    let threw = false
    try {
      decryptTokens(tampered)
    } catch {
      threw = true
    }
    assert(threw, 'Debería lanzar con tag corrupto')
    delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  })

  await test('[google-oauth] isGoogleConfigured() → false sin vars', async () => {
    const saved = {
      id: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect: process.env.GOOGLE_REDIRECT_URI,
    }
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    delete process.env.GOOGLE_REDIRECT_URI

    assert(isGoogleConfigured() === false, 'Debería devolver false sin variables')

    if (saved.id) process.env.GOOGLE_CLIENT_ID = saved.id
    if (saved.secret) process.env.GOOGLE_CLIENT_SECRET = saved.secret
    if (saved.redirect) process.env.GOOGLE_REDIRECT_URI = saved.redirect
  })

  // ── Integración: endpoints HTTP ────────────────────────────────────────────

  let authToken: string | null = null

  // Obtener token de autenticación
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.EXECUTIVE_EMAIL ?? 'ejecutivo@agenda.local',
        password: 'Agenda2026!',
      }),
    })
    if (loginRes.ok) {
      const data = await loginRes.json() as { token?: string }
      authToken = data.token ?? null
    }
  } catch {
    console.warn('  ⚠️  Servidor no disponible — skipping HTTP tests')
  }

  if (authToken) {
    await test('GET /api/calendar/status sin auth → 401', async () => {
      const res = await fetch(`${BASE_URL}/api/calendar/status`)
      assert(res.status === 401, `Esperado 401, recibido ${res.status}`)
    })

    await test('GET /api/calendar/status con auth → 200', async () => {
      const res = await fetch(`${BASE_URL}/api/calendar/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      assert(res.status === 200, `Esperado 200, recibido ${res.status}`)
      const data = await res.json() as { connected: boolean; configured: boolean }
      assert(typeof data.connected === 'boolean', 'connected debe ser boolean')
      assert(typeof data.configured === 'boolean', 'configured debe ser boolean')
    })

    await test('POST /api/calendar/disconnect sin auth → 401', async () => {
      const res = await fetch(`${BASE_URL}/api/calendar/disconnect`, { method: 'POST' })
      assert(res.status === 401, `Esperado 401, recibido ${res.status}`)
    })

    await test('GET /api/auth/google sin auth → 401', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/google`, { redirect: 'manual' })
      assert(res.status === 401, `Esperado 401, recibido ${res.status}`)
    })

    await test('GET /api/auth/google con auth (sin config Google) → 200 con url o 503', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/google`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      // 200 con { url } = Google configurado → devuelve URL de autorización
      // 503 = Google no configurado
      if (res.status === 200) {
        const data = await res.json() as { url?: string }
        assert(typeof data.url === 'string' && data.url.startsWith('https://accounts.google.com'), `url debe ser de Google: ${data.url}`)
      } else {
        assert(res.status === 503, `Esperado 200 o 503, recibido ${res.status}`)
      }
    })

    await test('GET /api/auth/google/callback sin code/state → 400', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/google/callback`)
      assert(res.status === 400, `Esperado 400, recibido ${res.status}`)
    })

    await test('GET /api/auth/google/callback con error=access_denied → redirect /dashboard', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/google/callback?error=access_denied`, {
        redirect: 'manual',
      })
      assert(res.status === 307 || res.status === 302, `Esperado redirect (302/307), recibido ${res.status}`)
      const location = res.headers.get('location') ?? ''
      assert(location.includes('google=denied'), `Location debe incluir google=denied: ${location}`)
    })
  } else {
    console.log('  ⚠️  Servidor no disponible — tests HTTP omitidos')
  }

  // ── Resultado ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(54)}`)
  console.log(`Total: ${passed + failed} | ✅ ${passed} | ❌ ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
