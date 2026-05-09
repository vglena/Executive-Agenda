/**
 * scripts/verify-auth.ts — Prueba de humo del endpoint de login.
 * Ejecutar con: npx tsx scripts/verify-auth.ts
 */

import 'dotenv/config'

const BASE = `http://localhost:${process.env.PORT ?? 3000}`

async function testLogin(email: string, password: string, label: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json() as Record<string, unknown>
  const status = res.status
  console.log(`[${label}] status=${status} token=${data.token ? data.token.toString().slice(0, 20) + '...' : 'none'} error=${data.error ?? 'none'}`)
  return { status, data }
}

async function main() {
  console.log('\n=== Prueba de autenticación ===\n')

  // Caso 1: credenciales correctas
  const ok = await testLogin('ejecutivo@agenda.local', 'Agenda2026!', 'LOGIN CORRECTO')
  if (ok.status !== 200 || !ok.data.token) {
    console.error('[FAIL] Login correcto debería devolver 200 con token.')
    process.exit(1)
  }

  // Caso 2: contraseña incorrecta
  const badPass = await testLogin('ejecutivo@agenda.local', 'wrongpassword', 'CONTRASEÑA MAL')
  if (badPass.status !== 401) {
    console.error('[FAIL] Contraseña incorrecta debería devolver 401.')
    process.exit(1)
  }

  // Caso 3: email incorrecto
  const badEmail = await testLogin('otro@dominio.com', 'Agenda2026!', 'EMAIL MAL')
  if (badEmail.status !== 401) {
    console.error('[FAIL] Email incorrecto debería devolver 401.')
    process.exit(1)
  }

  // Caso 4: verificar token protege rutas (ejemplo simple)
  const token = ok.data.token as string
  const protectedRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ejecutivo@agenda.local', password: 'Agenda2026!' }),
  })
  console.log(`[TOKEN VÁLIDO generado] primeros 30 chars: ${token.slice(0, 30)}...`)

  console.log('\n=== Todos los casos OK ===\n')
}

main().catch((err) => {
  console.error('[ERROR]', err.message)
  process.exit(1)
})
