/**
 * scripts/verify-tasks.ts — Smoke test del CRUD /api/tasks
 *
 * Requiere el servidor corriendo en localhost:3000.
 * Ejecutar con: npx tsx scripts/verify-tasks.ts
 *
 * Prueba 14 casos:
 *   1.  Sin token → 401
 *   2.  Login → token
 *   3.  POST solo título → 201
 *   4.  POST todos los campos → 201
 *   5.  GET lista → 2 tareas
 *   6.  GET ?estado=pendiente → filtrado
 *   7.  GET /[id] → 200
 *   8.  PUT título → 200 actualizado
 *   9.  PUT estado=completada → completed_at set
 *   10. PUT prioridad inválida → 400
 *   11. DELETE tarea → 204
 *   12. GET /[id] eliminada → 404
 *   13. GET lista → 1 tarea
 *   14. Limpieza: DELETE tarea restante → 204
 */

import 'dotenv/config'

const BASE = `http://localhost:${process.env.PORT ?? 3000}`

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

  // 204 no tiene cuerpo
  if (res.status === 204) return { status: 204, data: null }

  const data = await res.json()
  return { status: res.status, data }
}

async function main() {
  console.log('\n=== Smoke test: CRUD /api/tasks ===\n')

  // 1. Sin token → 401
  {
    const { status } = await api('GET', '/api/tasks')
    assert('1. GET /api/tasks sin token → 401', status === 401)
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

  // 3. POST solo título → 201
  let idMinimo: string
  {
    const { status, data } = await api('POST', '/api/tasks', token, { titulo: 'Tarea mínima' })
    const d = data as Record<string, unknown>
    const tarea = d.tarea as Record<string, unknown>
    assert(
      '3. POST tarea con solo título → 201',
      status === 201 &&
        tarea?.titulo === 'Tarea mínima' &&
        tarea?.prioridad_manual === 'P3' &&
        tarea?.estado === 'pendiente',
    )
    idMinimo = tarea?.id as string
    if (idMinimo) createdIds.push(idMinimo)
  }

  // 4. POST todos los campos → 201
  let idCompleta: string
  {
    const { status, data } = await api('POST', '/api/tasks', token, {
      titulo: 'Tarea completa',
      descripcion: 'Con todos los campos',
      fecha_limite: '2026-12-31',
      prioridad_manual: 'P1',
      estado: 'pendiente',
    })
    const d = data as Record<string, unknown>
    const tarea = d.tarea as Record<string, unknown>
    assert(
      '4. POST tarea con todos los campos → 201',
      status === 201 &&
        tarea?.titulo === 'Tarea completa' &&
        tarea?.fecha_limite === '2026-12-31' &&
        tarea?.prioridad_manual === 'P1',
    )
    idCompleta = tarea?.id as string
    if (idCompleta) createdIds.push(idCompleta)
  }

  // 5. GET lista → 2 tareas (mínimo — puede haber más de seed)
  {
    const { status, data } = await api('GET', '/api/tasks', token)
    const d = data as Record<string, unknown>
    const tareas = d.tareas as unknown[]
    assert(
      '5. GET /api/tasks → ≥2 tareas en respuesta',
      status === 200 && tareas.length >= 2,
    )
  }

  // 6. GET ?estado=pendiente → filtrado
  {
    const { status, data } = await api('GET', '/api/tasks?estado=pendiente', token)
    const d = data as Record<string, unknown>
    const tareas = d.tareas as Array<Record<string, unknown>>
    const soloAbiertas = tareas.every((t) => t.estado === 'pendiente')
    assert(
      '6. GET ?estado=pendiente → solo tareas pendientes',
      status === 200 && soloAbiertas,
    )
  }

  // 7. GET /[id] → 200
  {
    const { status, data } = await api('GET', `/api/tasks/${idMinimo!}`, token)
    const d = data as Record<string, unknown>
    const tarea = d.tarea as Record<string, unknown>
    assert(
      '7. GET /api/tasks/[id] → 200 con tarea correcta',
      status === 200 && tarea?.id === idMinimo,
    )
  }

  // 8. PUT título → 200 actualizado
  {
    const { status, data } = await api('PUT', `/api/tasks/${idMinimo!}`, token, {
      titulo: 'Tarea mínima editada',
    })
    const d = data as Record<string, unknown>
    const tarea = d.tarea as Record<string, unknown>
    assert(
      '8. PUT /api/tasks/[id] título → 200 con título actualizado',
      status === 200 && tarea?.titulo === 'Tarea mínima editada',
    )
  }

  // 9. PUT estado=completada → completed_at set
  {
    const { status, data } = await api('PUT', `/api/tasks/${idMinimo!}`, token, {
      estado: 'completada',
    })
    const d = data as Record<string, unknown>
    const tarea = d.tarea as Record<string, unknown>
    assert(
      '9. PUT estado=completada → completed_at registrado',
      status === 200 && tarea?.estado === 'completada' && tarea?.completed_at !== null,
    )
  }

  // 10. PUT prioridad inválida → 400
  {
    const { status } = await api('PUT', `/api/tasks/${idMinimo!}`, token, {
      prioridad_manual: 'P9',
    })
    assert('10. PUT prioridad inválida → 400', status === 400)
  }

  // 11. DELETE tarea mínima → 204
  {
    const { status } = await api('DELETE', `/api/tasks/${idMinimo!}`, token)
    assert('11. DELETE /api/tasks/[id] → 204', status === 204)
    createdIds.splice(createdIds.indexOf(idMinimo!), 1)
  }

  // 12. GET /[id] eliminada → 404
  {
    const { status } = await api('GET', `/api/tasks/${idMinimo!}`, token)
    assert('12. GET /api/tasks/[id] eliminada → 404', status === 404)
  }

  // 13. GET lista → tarea mínima ya no aparece
  {
    const { status, data } = await api('GET', '/api/tasks', token)
    const d = data as Record<string, unknown>
    const tareas = d.tareas as Array<Record<string, unknown>>
    const noContiene = !tareas.some((t) => t.id === idMinimo)
    assert('13. GET lista → tarea eliminada ya no aparece', status === 200 && noContiene)
  }

  // 14. Limpieza: DELETE tarea completa → 204
  {
    const { status } = await api('DELETE', `/api/tasks/${idCompleta!}`, token)
    assert('14. Limpieza: DELETE tarea completa → 204', status === 204)
    createdIds.splice(createdIds.indexOf(idCompleta!), 1)
  }

  // Resultado
  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Resultado: ${ok} OK · ${fail} FAIL`)

  if (fail > 0) {
    // Intentar limpiar datos creados que no se pudieron eliminar
    for (const id of createdIds) {
      await api('DELETE', `/api/tasks/${id}`, token).catch(() => null)
    }
    process.exit(1)
  }

  console.log('✓ CRUD /api/tasks — todos los casos OK\n')
}

main().catch((err) => {
  console.error('[ERROR FATAL]', err.message)
  process.exit(1)
})
