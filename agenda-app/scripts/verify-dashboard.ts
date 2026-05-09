/**
 * scripts/verify-dashboard.ts — Verificación del Dashboard UI (F2-04)
 *
 * Comprueba:
 *   1.  GET / → redirige (307) a /dashboard
 *   2.  GET /login → 200 con HTML del formulario
 *   3.  GET /dashboard → 200 con shell HTML (autenticación client-side)
 *   4.  Login API → 200 con token
 *   5.  GET /api/events?fecha=HOY → 200 con array (agenda del día)
 *   6.  GET /api/priorities/today → 200 con tareas[]
 *   7.  GET /api/tasks?estado=pendiente → 200 con tareas[]
 *   8.  GET /api/reminders?estado=activo → 200 con recordatorios[]
 *   9.  GET /api/daily-summary → 200 con contenido_completo
 *  10.  GET /login con token previo → seguirá en 200 (redirige client-side)
 *
 * Ejecución: npx tsx scripts/verify-dashboard.ts
 */

import 'dotenv/config'

const BASE = `http://localhost:${process.env.PORT ?? 3000}`
const HOY = new Date().toISOString().split('T')[0]

let ok = 0
let fail = 0

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    ok++
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    fail++
  }
}

async function fetchRaw(path: string, opts: RequestInit = {}) {
  return fetch(`${BASE}${path}`, { ...opts, redirect: 'manual' })
}

async function api(method: string, path: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return { status: 204, data: null }
  return { status: res.status, data: await res.json() }
}

async function main() {
  console.log('\n=== Verificación UI: Dashboard F2-04 ===\n')

  // Warmup: forzar compilación de rutas nuevas en dev mode
  await fetchRaw('/login').catch(() => null)
  await fetchRaw('/dashboard').catch(() => null)
  // Pequeña pausa para que el servidor termine de compilar
  await new Promise((r) => setTimeout(r, 3000))
  console.log('  (warmup completado)\n')

  // 1. GET / → redirect 307 o 308
  {
    const res = await fetchRaw('/')
    assert(
      '1. GET / → redirige (307/308)',
      res.status === 307 || res.status === 308,
      `status=${res.status}`,
    )
  }

  // 2. GET /login → 200 con HTML del formulario
  {
    const res = await fetchRaw('/login')
    const html = await res.text()
    assert(
      '2. GET /login → 200 con HTML',
      res.status === 200 && html.includes('<!DOCTYPE html'),
      `status=${res.status}`,
    )
    assert(
      '2b. /login contiene "Agenda Ejecutiva" en HTML',
      html.includes('Agenda Ejecutiva'),
    )
  }

  // 3. GET /dashboard → 200 (shell HTML, auth client-side)
  {
    const res = await fetchRaw('/dashboard')
    const html = await res.text()
    assert(
      '3. GET /dashboard → 200 con HTML',
      res.status === 200 && html.includes('<!DOCTYPE html'),
      `status=${res.status}`,
    )
  }

  // 4. Login → token
  let token: string
  {
    const { status, data } = await api('POST', '/api/auth/login', undefined, {
      email: process.env.EXECUTIVE_EMAIL ?? 'ejecutivo@agenda.local',
      password: 'Agenda2026!',
    })
    const d = data as Record<string, unknown>
    assert('4. Login API → 200 con token', status === 200 && typeof d.token === 'string')
    token = d.token as string
  }

  // 5. Agenda del día
  {
    const { status, data } = await api('GET', `/api/events?fecha=${HOY}`, token)
    const d = data as Record<string, unknown>
    assert(
      '5. GET /api/events?fecha=HOY → 200',
      status === 200 && Array.isArray(d.eventos),
      `status=${status}`,
    )
  }

  // 6. Top prioridades
  {
    const { status, data } = await api('GET', '/api/priorities/today', token)
    const d = data as Record<string, unknown>
    assert(
      '6. GET /api/priorities/today → 200',
      status === 200 && Array.isArray(d.tareas),
      `status=${status}`,
    )
  }

  // 7. Tareas pendientes
  {
    const { status, data } = await api('GET', '/api/tasks?estado=pendiente', token)
    const d = data as Record<string, unknown>
    assert(
      '7. GET /api/tasks?estado=pendiente → 200',
      status === 200 && Array.isArray(d.tareas),
      `status=${status}`,
    )
  }

  // 8. Recordatorios activos
  {
    const { status, data } = await api('GET', '/api/reminders?estado=activo', token)
    const d = data as Record<string, unknown>
    assert(
      '8. GET /api/reminders?estado=activo → 200',
      status === 200 && Array.isArray(d.recordatorios),
      `status=${status}`,
    )
  }

  // 9. Resumen diario
  {
    const { status, data } = await api('GET', '/api/daily-summary', token)
    const d = data as Record<string, unknown>
    assert(
      '9. GET /api/daily-summary → 200 con contenido',
      status === 200 && typeof d.contenido_completo === 'string',
      `status=${status}`,
    )
  }

  // 10. Login sin token → 200 (página accesible)
  {
    const res = await fetchRaw('/login')
    assert(
      '10. GET /login accesible sin token → 200',
      res.status === 200,
    )
  }

  console.log(`\n${'─'.repeat(42)}`)
  console.log(`Resultado: ${ok} OK · ${fail} FAIL`)

  if (fail > 0) process.exit(1)
  console.log('✓ Dashboard UI (F2-04) — verificación OK\n')
}

main().catch((err) => {
  console.error('[ERROR FATAL]', err.message)
  process.exit(1)
})
