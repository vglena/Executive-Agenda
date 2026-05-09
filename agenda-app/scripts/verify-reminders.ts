/**
 * scripts/verify-reminders.ts — Smoke test de /api/reminders y /api/daily-summary
 *
 * Requiere el servidor corriendo en localhost (PORT o 3000).
 * Ejecutar con: npx tsx scripts/verify-reminders.ts
 *
 * 18 casos:
 *   1.  Sin token → 401
 *   2.  Login → token
 *   3.  Crear tarea de apoyo
 *   4.  Crear evento de apoyo
 *   5.  POST recordatorio asociado a tarea (antelación auto) → 201
 *   6.  POST duplicado mismo task_id → 409
 *   7.  POST recordatorio evento con fecha_hora_disparo explícita → 201
 *   8.  POST sin task_id ni event_id → 400
 *   9.  POST antelacion_tipo "personalizado" sin fecha → 400
 *   10. GET lista → ≥2 recordatorios
 *   11. GET ?estado=activo → solo activos
 *   12. GET /[id] → 200 correcto
 *   13. PUT mensaje → 200 actualizado
 *   14. PUT estado=cancelado → 200
 *   15. PUT cancelado → activo (reactivar) → 200
 *   16. PUT disparado → activo (bloqueado) → 409
 *   17. DELETE recordatorio → 204
 *   18. GET /api/daily-summary → 200 con campos requeridos
 *   Limpieza: tarea, evento y recordatorios restantes
 */

import 'dotenv/config'

const BASE = `http://localhost:${process.env.PORT ?? 3000}`
const HOY = new Date().toISOString().split('T')[0]
const DISPARO_ISO = new Date(Date.now() + 3600000).toISOString() // +1h desde ahora

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
  return { status: res.status, data: await res.json() }
}

async function main() {
  console.log('\n=== Smoke test: CRUD /api/reminders + /api/daily-summary ===\n')

  // 1. Sin token
  {
    const { status } = await api('GET', '/api/reminders')
    assert('1. GET /api/reminders sin token → 401', status === 401)
  }

  // 2. Login
  let token: string
  {
    const { status, data } = await api('POST', '/api/auth/login', undefined, {
      email: process.env.EXECUTIVE_EMAIL ?? 'ejecutivo@agenda.local',
      password: 'Agenda2026!',
    })
    const d = data as Record<string, unknown>
    assert('2. Login → token', status === 200 && typeof d.token === 'string')
    token = d.token as string
  }

  // 3. Crear tarea de apoyo (con fecha_limite para calcular disparo)
  let taskId: string
  {
    const { data } = await api('POST', '/api/tasks', token, {
      titulo: '[test] Tarea para recordatorio',
      fecha_limite: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // +7 días
    })
    const d = data as Record<string, unknown>
    taskId = (d.tarea as Record<string, unknown>)?.id as string
    assert('3. Tarea de apoyo creada', !!taskId)
  }

  // 4. Crear evento de apoyo
  let eventId: string
  {
    const mañana = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data } = await api('POST', '/api/events', token, {
      titulo: '[test] Evento para recordatorio',
      fecha: mañana,
      hora_inicio: '10:00',
      hora_fin: '11:00',
    })
    const d = data as Record<string, unknown>
    eventId = (d.evento as Record<string, unknown>)?.id as string
    assert('4. Evento de apoyo creado', !!eventId)
  }

  // 5. POST recordatorio en tarea (antelación automática) → 201
  let reminderId1: string
  {
    const { status, data } = await api('POST', '/api/reminders', token, {
      task_id: taskId,
      antelacion_tipo: '1dia',
    })
    const d = data as Record<string, unknown>
    const r = d.recordatorio as Record<string, unknown>
    assert(
      '5. POST recordatorio tarea (1dia auto) → 201',
      status === 201 && r?.entidad_tipo === 'tarea' && r?.estado === 'activo',
    )
    reminderId1 = r?.id as string
  }

  // 6. POST duplicado mismo task_id → 409
  {
    const { status, data } = await api('POST', '/api/reminders', token, {
      task_id: taskId,
      antelacion_tipo: '30min',
      fecha_hora_disparo: DISPARO_ISO,
    })
    const d = data as Record<string, unknown>
    assert(
      '6. POST duplicado task_id activo → 409',
      status === 409 && typeof d.recordatorio_id === 'string',
    )
  }

  // 7. POST recordatorio evento con fecha_hora_disparo explícita → 201
  let reminderId2: string
  {
    const { status, data } = await api('POST', '/api/reminders', token, {
      event_id: eventId,
      antelacion_tipo: 'personalizado',
      fecha_hora_disparo: DISPARO_ISO,
      mensaje: 'Preparar presentación',
    })
    const d = data as Record<string, unknown>
    const r = d.recordatorio as Record<string, unknown>
    assert(
      '7. POST recordatorio evento (personalizado) → 201',
      status === 201 && r?.entidad_tipo === 'evento' && r?.mensaje === 'Preparar presentación',
    )
    reminderId2 = r?.id as string
  }

  // 8. POST sin task_id ni event_id → 400
  {
    const { status } = await api('POST', '/api/reminders', token, {
      antelacion_tipo: '1h',
      fecha_hora_disparo: DISPARO_ISO,
    })
    assert('8. POST sin task_id ni event_id → 400', status === 400)
  }

  // 9. POST antelacion "personalizado" sin fecha → 400
  {
    const { status } = await api('POST', '/api/reminders', token, {
      event_id: eventId,
      antelacion_tipo: 'personalizado',
    })
    assert('9. POST personalizado sin fecha_hora_disparo → 400', status === 400)
  }

  // 10. GET lista → ≥2
  {
    const { status, data } = await api('GET', '/api/reminders', token)
    const d = data as Record<string, unknown>
    const list = d.recordatorios as unknown[]
    assert('10. GET /api/reminders → ≥2 recordatorios', status === 200 && list.length >= 2)
  }

  // 11. GET ?estado=activo
  {
    const { status, data } = await api('GET', '/api/reminders?estado=activo', token)
    const d = data as Record<string, unknown>
    const list = d.recordatorios as Array<Record<string, unknown>>
    const soloActivos = list.every((r) => r.estado === 'activo')
    assert('11. GET ?estado=activo → solo activos', status === 200 && soloActivos)
  }

  // 12. GET /[id] → 200
  {
    const { status, data } = await api('GET', `/api/reminders/${reminderId1}`, token)
    const d = data as Record<string, unknown>
    const r = d.recordatorio as Record<string, unknown>
    assert('12. GET /api/reminders/[id] → 200', status === 200 && r?.id === reminderId1)
  }

  // 13. PUT mensaje → actualizado
  {
    const { status, data } = await api('PUT', `/api/reminders/${reminderId1}`, token, {
      mensaje: 'Mensaje actualizado',
    })
    const d = data as Record<string, unknown>
    const r = d.recordatorio as Record<string, unknown>
    assert('13. PUT mensaje → 200 actualizado', status === 200 && r?.mensaje === 'Mensaje actualizado')
  }

  // 14. PUT estado=cancelado
  {
    const { status, data } = await api('PUT', `/api/reminders/${reminderId2}`, token, {
      estado: 'cancelado',
    })
    const d = data as Record<string, unknown>
    const r = d.recordatorio as Record<string, unknown>
    assert('14. PUT estado=cancelado → 200', status === 200 && r?.estado === 'cancelado')
  }

  // 15. PUT cancelado → activo (reactivar)
  {
    const { status, data } = await api('PUT', `/api/reminders/${reminderId2}`, token, {
      estado: 'activo',
    })
    const d = data as Record<string, unknown>
    const r = d.recordatorio as Record<string, unknown>
    assert('15. PUT cancelado → activo (reactivar) → 200', status === 200 && r?.estado === 'activo')
  }

  // 16. PUT disparado → activo (bloqueado)
  // Primero marcamos como disparado, luego intentamos reactivar
  {
    await api('PUT', `/api/reminders/${reminderId2}`, token, { estado: 'disparado' })
    const { status } = await api('PUT', `/api/reminders/${reminderId2}`, token, { estado: 'activo' })
    assert('16. PUT disparado → activo → 409 bloqueado', status === 409)
  }

  // 17. DELETE
  {
    const { status } = await api('DELETE', `/api/reminders/${reminderId1}`, token)
    assert('17. DELETE /api/reminders/[id] → 204', status === 204)
  }

  // 18. GET /api/daily-summary → 200
  {
    const { status, data } = await api('GET', '/api/daily-summary', token)
    const d = data as Record<string, unknown>
    assert(
      '18. GET /api/daily-summary → 200 con campos requeridos',
      status === 200 &&
        typeof d.fecha === 'string' &&
        typeof d.contenido_completo === 'string' &&
        typeof d.sugerencia_del_dia === 'string' &&
        Array.isArray(d.eventos_del_dia),
    )
  }

  // Limpieza
  await api('DELETE', `/api/reminders/${reminderId2}`, token).catch(() => null)
  await api('DELETE', `/api/tasks/${taskId}`, token).catch(() => null)
  await api('DELETE', `/api/events/${eventId}`, token).catch(() => null)

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Resultado: ${ok} OK · ${fail} FAIL`)

  if (fail > 0) process.exit(1)
  console.log('✓ CRUD /api/reminders + /api/daily-summary — todos los casos OK\n')
}

main().catch((err) => {
  console.error('[ERROR FATAL]', err.message)
  process.exit(1)
})
