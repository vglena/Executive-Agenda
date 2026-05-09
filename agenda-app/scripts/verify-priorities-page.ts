/**
 * verify-priorities-page.ts
 * Smoke tests para F2-06 — Vista de prioridades + resumen diario
 * Ejecutar con: npx tsx scripts/verify-priorities-page.ts
 */

import 'dotenv/config'

const BASE = `http://localhost:${process.env.PORT ?? 3000}`
const PASS = process.env.EXECUTIVE_PASSWORD || 'Agenda2026!'

let passed = 0
let failed = 0

async function fetchRaw(path: string, opts: RequestInit = {}) {
  return fetch(`${BASE}${path}`, opts)
}

function ok(name: string) {
  console.log(`  ✓ ${name}`)
  passed++
}
function fail(name: string, detail?: string) {
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  failed++
}

async function main() {
  console.log('\n=== Verificación F2-06: Prioridades + Resumen diario ===\n')

  // Warmup
  console.log('Calentando servidor (dev mode)…')
  await fetchRaw('/priorities').catch(() => null)
  await new Promise<void>((r) => setTimeout(r, 3000))

  // 1. Login
  console.log('\n1. Autenticación')
  let token = ''
  try {
    const r = await fetchRaw('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.EXECUTIVE_EMAIL ?? 'ejecutivo@agenda.local',
        password: PASS,
      }),
    })
    const d = (await r.json()) as { token?: string }
    if (r.status === 200 && d.token) {
      token = d.token
      ok('Login devuelve token (200)')
    } else {
      fail('Login devuelve token (200)', `status=${r.status}`)
    }
  } catch (e) {
    fail('Login devuelve token (200)', String(e))
  }

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // 2. API prioridades existente
  console.log('\n2. GET /api/priorities/today')
  try {
    const r = await fetchRaw('/api/priorities/today', { headers })
    const d = (await r.json()) as { fecha?: string; tareas?: unknown[] }
    if (r.status === 200 && d.fecha && Array.isArray(d.tareas)) {
      ok(`GET /api/priorities/today 200 — ${d.tareas.length} tareas`)
    } else {
      fail('GET /api/priorities/today 200', `status=${r.status}`)
    }
  } catch (e) {
    fail('GET /api/priorities/today 200', String(e))
  }

  // 3. POST recalculate
  console.log('\n3. POST /api/priorities/recalculate')
  try {
    const r = await fetchRaw('/api/priorities/recalculate', { method: 'POST', headers })
    const d = (await r.json()) as { ok?: boolean }
    if (r.status === 200 && d.ok === true) {
      ok('POST /api/priorities/recalculate 200')
    } else {
      fail('POST /api/priorities/recalculate 200', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST /api/priorities/recalculate 200', String(e))
  }

  // 4. Sin token → 401
  console.log('\n4. Auth guard')
  try {
    const r = await fetchRaw('/api/priorities/recalculate', { method: 'POST' })
    if (r.status === 401) {
      ok('POST recalculate sin token 401')
    } else {
      fail('POST recalculate sin token 401', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST recalculate sin token 401', String(e))
  }

  // 5. GET daily-summary
  console.log('\n5. GET /api/daily-summary')
  try {
    const r = await fetchRaw('/api/daily-summary', { headers })
    const d = (await r.json()) as { fecha?: string; contenido_completo?: string }
    if (r.status === 200 && d.fecha && typeof d.contenido_completo === 'string') {
      ok('GET /api/daily-summary 200')
    } else {
      fail('GET /api/daily-summary 200', `status=${r.status}`)
    }
  } catch (e) {
    fail('GET /api/daily-summary 200', String(e))
  }

  // 6. POST regenerate
  console.log('\n6. POST /api/daily-summary/regenerate')
  try {
    const r = await fetchRaw('/api/daily-summary/regenerate', { method: 'POST', headers })
    const d = (await r.json()) as { fecha?: string }
    if (r.status === 200 && d.fecha) {
      ok('POST /api/daily-summary/regenerate 200')
    } else {
      fail('POST /api/daily-summary/regenerate 200', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST /api/daily-summary/regenerate 200', String(e))
  }

  // 7. Sin token → 401
  try {
    const r = await fetchRaw('/api/daily-summary/regenerate', { method: 'POST' })
    if (r.status === 401) {
      ok('POST regenerate sin token 401')
    } else {
      fail('POST regenerate sin token 401', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST regenerate sin token 401', String(e))
  }

  // 8. Páginas UI accesibles
  console.log('\n7. Páginas UI')
  for (const [label, path] of [
    ['/priorities accesible', '/priorities'],
    ['/dashboard accesible', '/dashboard'],
  ] as [string, string][]) {
    try {
      const r = await fetchRaw(path, { redirect: 'manual' })
      if (r.status === 200 || r.status === 307 || r.status === 308) {
        ok(label)
      } else {
        fail(label, `status=${r.status}`)
      }
    } catch (e) {
      fail(label, String(e))
    }
  }

  // Resultado
  const total = passed + failed
  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Resultado: ${passed}/${total} passed`)
  if (failed > 0) {
    console.error(`FAILED: ${failed}`)
    process.exit(1)
  } else {
    console.log('TODOS LOS TESTS PASARON')
  }
}

main().catch((e) => {
  console.error('Error inesperado:', e)
  process.exit(1)
})
