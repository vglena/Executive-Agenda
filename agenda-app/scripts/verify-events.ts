/**
 * scripts/verify-events.ts — Smoke test del CRUD /api/events
 *
 * Requiere el servidor corriendo en localhost (PORT o 3000).
 * Ejecutar con: npx tsx scripts/verify-events.ts
 *
 * 16 casos:
 *   1.  Sin token → 401
 *   2.  Login → token
 *   3.  POST evento mínimo → 201
 *   4.  POST evento completo → 201
 *   5.  POST evento solapado → 201 con conflicto_detectado=true
 *   6.  POST hora_fin ≤ hora_inicio → 400
 *   7.  POST fecha inválida → 400
 *   8.  GET lista → ≥2 eventos
 *   9.  GET ?fecha=YYYY-MM-DD → filtrado por día
 *   10. GET ?fecha_desde / fecha_hasta → rango
 *   11. GET /[id] → 200 con datos correctos
 *   12. PUT título y ubicación → 200 actualizado
 *   13. PUT hora inválida → 400
 *   14. DELETE evento solapado → 204 (limpieza)
 *   15. DELETE evento principal → 204
 *   16. GET /[id] eliminado → 404
 */

import 'dotenv/config'

const BASE = `http://localhost:${process.env.PORT ?? 3000}`
const HOY = new Date().toISOString().split('T')[0]  // YYYY-MM-DD
const MANANA = new Date(Date.now() + 86400000).toISOString().split('T')[0]

let ok = 0
let fail = 0
const createdIds: string[] = []

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    ok++
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    fail++
  }
}

async function api(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return { status: 204, data: null }
  const data = await res.json()
  return { status: res.status, data }
}

async function cleanup(token: string) {
  for (const id of [...createdIds]) {
    await api('DELETE', `/api/events/${id}`, token).catch(() => null)
  }
}

async function main() {
  console.log('\n=== Smoke test: CRUD /api/events ===\n')

  // 1. Sin token → 401
  {
    const { status } = await api('GET', '/api/events')
    assert('1. GET /api/events sin token → 401', status === 401)
  }

  // 2. Login
  let token: string
  {
    const { status, data } = await api('POST', '/api/auth/login', undefined, {
      email: process.env.EXECUTIVE_EMAIL ?? 'ejecutivo@agenda.local',
      password: 'Agenda2026!',
    })
    const d = data as Record<string, unknown>
    assert('2. Login exitoso → 200 con token', status === 200 && typeof d.token === 'string')
    token = d.token as string
  }

  // 3. POST evento mínimo → 201
  let idMinimo: string
  {
    const { status, data } = await api('POST', '/api/events', token, {
      titulo: 'Reunión mínima',
      fecha: HOY,
      hora_inicio: '09:00',
      hora_fin: '10:00',
    })
    const d = data as Record<string, unknown>
    const evento = d.evento as Record<string, unknown>
    assert(
      '3. POST evento mínimo → 201',
      status === 201 &&
        evento?.titulo === 'Reunión mínima' &&
        evento?.origen === 'manual' &&
        evento?.sincronizado === false,
    )
    idMinimo = evento?.id as string
    if (idMinimo) createdIds.push(idMinimo)
  }

  // 4. POST evento completo → 201
  let idCompleto: string
  {
    const { status, data } = await api('POST', '/api/events', token, {
      titulo: 'Board Meeting',
      fecha: MANANA,
      hora_inicio: '14:00',
      hora_fin: '15:30',
      descripcion: 'Reunión de directivos',
      ubicacion: 'Sala A · Piso 3',
    })
    const d = data as Record<string, unknown>
    const evento = d.evento as Record<string, unknown>
    assert(
      '4. POST evento completo → 201 con ubicacion',
      status === 201 &&
        evento?.ubicacion === 'Sala A · Piso 3' &&
        evento?.fecha === MANANA,
    )
    idCompleto = evento?.id as string
    if (idCompleto) createdIds.push(idCompleto)
  }

  // 5. POST evento solapado → 201 con conflicto_detectado=true
  let idSolapado: string
  {
    const { status, data } = await api('POST', '/api/events', token, {
      titulo: 'Evento solapado',
      fecha: HOY,
      hora_inicio: '09:30',
      hora_fin: '10:30',
    })
    const d = data as Record<string, unknown>
    const evento = d.evento as Record<string, unknown>
    assert(
      '5. POST solapado → 201 con conflicto_detectado=true',
      status === 201 && evento?.conflicto_detectado === true,
    )
    idSolapado = evento?.id as string
    if (idSolapado) createdIds.push(idSolapado)
  }

  // 6. POST hora_fin ≤ hora_inicio → 400
  {
    const { status } = await api('POST', '/api/events', token, {
      titulo: 'Hora inválida',
      fecha: HOY,
      hora_inicio: '10:00',
      hora_fin: '09:00',
    })
    assert('6. POST hora_fin ≤ hora_inicio → 400', status === 400)
  }

  // 7. POST fecha inválida → 400
  {
    const { status } = await api('POST', '/api/events', token, {
      titulo: 'Fecha mala',
      fecha: '09-05-2026',
      hora_inicio: '08:00',
      hora_fin: '09:00',
    })
    assert('7. POST fecha inválida → 400', status === 400)
  }

  // 8. GET lista → ≥2 eventos
  {
    const { status, data } = await api('GET', '/api/events', token)
    const d = data as Record<string, unknown>
    const eventos = d.eventos as unknown[]
    assert('8. GET /api/events → ≥2 eventos', status === 200 && eventos.length >= 2)
  }

  // 9. GET ?fecha=HOY → solo eventos de hoy
  {
    const { status, data } = await api('GET', `/api/events?fecha=${HOY}`, token)
    const d = data as Record<string, unknown>
    const eventos = d.eventos as Array<Record<string, unknown>>
    const soloHoy = eventos.every((e) => e.fecha === HOY)
    assert('9. GET ?fecha=HOY → solo eventos de ese día', status === 200 && soloHoy && eventos.length >= 1)
  }

  // 10. GET ?fecha_desde / fecha_hasta → rango
  {
    const { status, data } = await api(
      'GET',
      `/api/events?fecha_desde=${HOY}&fecha_hasta=${MANANA}`,
      token,
    )
    const d = data as Record<string, unknown>
    const eventos = d.eventos as Array<Record<string, unknown>>
    const enRango = eventos.every((e) => e.fecha! >= HOY && e.fecha! <= MANANA)
    assert('10. GET rango fecha_desde/hasta → eventos en rango', status === 200 && enRango && eventos.length >= 2)
  }

  // 11. GET /[id] → 200 con datos correctos
  {
    const { status, data } = await api('GET', `/api/events/${idMinimo!}`, token)
    const d = data as Record<string, unknown>
    const evento = d.evento as Record<string, unknown>
    assert(
      '11. GET /api/events/[id] → 200 correcto',
      status === 200 && evento?.id === idMinimo,
    )
  }

  // 12. PUT título y ubicación → 200 actualizado
  {
    const { status, data } = await api('PUT', `/api/events/${idCompleto!}`, token, {
      titulo: 'Board Meeting Actualizado',
      ubicacion: 'Sala B · Piso 2',
    })
    const d = data as Record<string, unknown>
    const evento = d.evento as Record<string, unknown>
    assert(
      '12. PUT título y ubicación → 200 actualizado',
      status === 200 &&
        evento?.titulo === 'Board Meeting Actualizado' &&
        evento?.ubicacion === 'Sala B · Piso 2',
    )
  }

  // 13. PUT hora inválida → 400
  {
    const { status } = await api('PUT', `/api/events/${idCompleto!}`, token, {
      hora_inicio: '25:00',
    })
    assert('13. PUT hora inválida → 400', status === 400)
  }

  // 14. DELETE evento solapado (limpieza)
  {
    const { status } = await api('DELETE', `/api/events/${idSolapado!}`, token)
    assert('14. DELETE evento solapado → 204', status === 204)
    createdIds.splice(createdIds.indexOf(idSolapado!), 1)
  }

  // 15. DELETE evento principal → 204
  {
    const { status } = await api('DELETE', `/api/events/${idMinimo!}`, token)
    assert('15. DELETE /api/events/[id] → 204', status === 204)
    createdIds.splice(createdIds.indexOf(idMinimo!), 1)
  }

  // 16. GET /[id] eliminado → 404
  {
    const { status } = await api('GET', `/api/events/${idMinimo!}`, token)
    assert('16. GET /api/events/[id] eliminado → 404', status === 404)
  }

  // Limpieza final
  await cleanup(token)

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Resultado: ${ok} OK · ${fail} FAIL`)

  if (fail > 0) {
    process.exit(1)
  }

  console.log('✓ CRUD /api/events — todos los casos OK\n')
}

main().catch((err) => {
  console.error('[ERROR FATAL]', err.message)
  process.exit(1)
})
