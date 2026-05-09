/**
 * verify-quickadd.ts
 * Smoke tests para F2-05 — Formularios quick-add
 * Ejecutar con: npx tsx scripts/verify-quickadd.ts
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
  console.log('\n=== Verificación F2-05: Quick-add forms ===\n')

  // Warmup
  console.log('Calentando servidor (dev mode)…')
  await fetchRaw('/').catch(() => null)
  await fetchRaw('/').catch(() => null)
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

  // 2. Tareas
  console.log('\n2. Quick-add Tarea')

  let createdTaskId = ''
  try {
    const r = await fetchRaw('/api/tasks', {
      method: 'POST',
      headers,
      body: JSON.stringify({ titulo: 'Tarea QA quickadd', prioridad_manual: 'P2', fecha_limite: '2099-12-31' }),
    })
    const d = (await r.json()) as { tarea?: { id: string } }
    if (r.status === 201 && d.tarea?.id) {
      createdTaskId = d.tarea.id
      ok('POST tarea minima 201')
    } else {
      fail('POST tarea minima 201', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST tarea minima 201', String(e))
  }

  try {
    const r = await fetchRaw('/api/tasks', {
      method: 'POST',
      headers,
      body: JSON.stringify({ titulo: '' }),
    })
    if (r.status === 400) {
      ok('POST tarea sin titulo 400')
    } else {
      fail('POST tarea sin titulo 400', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST tarea sin titulo 400', String(e))
  }

  // 3. Eventos
  console.log('\n3. Quick-add Evento')

  let createdEventId = ''
  try {
    const r = await fetchRaw('/api/events', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        titulo: 'Reunion QA quickadd',
        fecha: '2099-12-01',
        hora_inicio: '09:00',
        hora_fin: '10:00',
      }),
    })
    const d = (await r.json()) as { evento?: { id: string } }
    if (r.status === 201 && d.evento?.id) {
      createdEventId = d.evento.id
      ok('POST evento valido 201')
    } else {
      fail('POST evento valido 201', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST evento valido 201', String(e))
  }

  try {
    const r = await fetchRaw('/api/events', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        titulo: 'Evento invalido',
        fecha: '2099-12-01',
        hora_inicio: '10:00',
        hora_fin: '09:00',
      }),
    })
    if (r.status === 400) {
      ok('POST evento hora_fin <= hora_inicio 400')
    } else {
      fail('POST evento hora_fin <= hora_inicio 400', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST evento hora_fin <= hora_inicio 400', String(e))
  }

  try {
    const r = await fetchRaw('/api/events', {
      method: 'POST',
      headers,
      body: JSON.stringify({ titulo: '' }),
    })
    if (r.status === 400) {
      ok('POST evento sin titulo 400')
    } else {
      fail('POST evento sin titulo 400', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST evento sin titulo 400', String(e))
  }

  // 4. Recordatorios
  console.log('\n4. Quick-add Recordatorio')

  if (createdTaskId) {
    try {
      const r = await fetchRaw('/api/reminders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ task_id: createdTaskId, antelacion_tipo: '1h' }),
      })
      if (r.status === 201) {
        ok('POST recordatorio con task_id valido 201')
      } else {
        fail('POST recordatorio con task_id valido 201', `status=${r.status}`)
      }
    } catch (e) {
      fail('POST recordatorio con task_id valido 201', String(e))
    }

    try {
      const r = await fetchRaw('/api/reminders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ task_id: createdTaskId, antelacion_tipo: '30min' }),
      })
      if (r.status === 409) {
        ok('POST recordatorio duplicado 409')
      } else {
        fail('POST recordatorio duplicado 409', `status=${r.status}`)
      }
    } catch (e) {
      fail('POST recordatorio duplicado 409', String(e))
    }
  } else {
    fail('POST recordatorio con task_id valido 201', 'no se creo tarea QA')
    fail('POST recordatorio duplicado 409', 'no se creo tarea QA')
  }

  try {
    const r = await fetchRaw('/api/reminders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        task_id: '00000000-0000-0000-0000-000000000000',
        antelacion_tipo: 'personalizado',
      }),
    })
    if (r.status === 400 || r.status === 422 || r.status === 404) {
      ok('POST recordatorio personalizado sin fecha 400/404')
    } else {
      fail('POST recordatorio personalizado sin fecha 400/404', `status=${r.status}`)
    }
  } catch (e) {
    fail('POST recordatorio personalizado sin fecha 400/404', String(e))
  }

  if (createdEventId) {
    try {
      const r = await fetchRaw('/api/reminders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ event_id: createdEventId, antelacion_tipo: '30min' }),
      })
      if (r.status === 201) {
        ok('POST recordatorio con event_id valido 201')
      } else {
        fail('POST recordatorio con event_id valido 201', `status=${r.status}`)
      }
    } catch (e) {
      fail('POST recordatorio con event_id valido 201', String(e))
    }
  } else {
    fail('POST recordatorio con event_id valido 201', 'no se creo evento QA')
  }

  // 5. Paginas UI
  console.log('\n5. Paginas UI accesibles')

  for (const [label, path] of [
    ['/ redirige', '/'],
    ['/login accesible', '/login'],
    ['/dashboard accesible', '/dashboard'],
  ] as [string, string][]) {
    try {
      const r = await fetchRaw(path, { redirect: 'manual' })
      const isOk = r.status === 200 || r.status === 307 || r.status === 308
      if (isOk) {
        ok(label)
      } else {
        fail(label, `status=${r.status}`)
      }
    } catch (e) {
      fail(label, String(e))
    }
  }

  // Limpieza
  if (createdTaskId) {
    await fetchRaw(`/api/tasks/${createdTaskId}`, { method: 'DELETE', headers }).catch(() => null)
  }
  if (createdEventId) {
    await fetchRaw(`/api/events/${createdEventId}`, { method: 'DELETE', headers }).catch(() => null)
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
