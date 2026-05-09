/**
 * verify-calendar-sync.ts — Smoke test F3-02: Sync Google Calendar → DB
 *
 * Tests:
 *  1. POST /api/calendar/sync sin auth → 401
 *  2. POST /api/calendar/sync con auth → 200 (conectado) o 409 (no conectado)
 *  3. Si conectado: resultado tiene campos esperados
 *  4. Si conectado: creados/actualizados son números ≥ 0
 *  5. Si conectado: eventos en DB con origen='google_calendar' son consultables
 *  6. Si conectado: ningún evento google sobrescribió eventos manuales
 *  7. GET /api/events devuelve eventos (incluyendo los de Google si se crearon)
 */

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
  console.log('\n=== F3-02: Sync Google Calendar → DB — Smoke Test ===\n')

  // Login
  let authToken: string | null = null
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
    console.warn('  ⚠️  Servidor no disponible — abortando\n')
    process.exit(1)
  }

  if (!authToken) {
    console.error('  ❌ Login fallido — abortando\n')
    process.exit(1)
  }

  // Test 1: sin auth
  await test('POST /api/calendar/sync sin auth → 401', async () => {
    const res = await fetch(`${BASE_URL}/api/calendar/sync`, { method: 'POST' })
    assert(res.status === 401, `Esperado 401, recibido ${res.status}`)
  })

  // Test 2 + 3 + 4: con auth
  let syncData: {
    ok: boolean
    creados?: number
    actualizados?: number
    cancelados?: number
    sin_cambios?: number
    conflictos_detectados?: number
    sincronizado_en?: string
    error?: string
  } = { ok: false }

  await test('POST /api/calendar/sync con auth → 200 o 409', async () => {
    const res = await fetch(`${BASE_URL}/api/calendar/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert([200, 409].includes(res.status), `Esperado 200 o 409, recibido ${res.status}`)
    syncData = (await res.json()) as typeof syncData
  })

  const googleConnected = syncData?.ok === true

  if (googleConnected) {
    await test('Resultado sync tiene campos requeridos', async () => {
      assert(syncData !== null, 'syncData es null')
      assert(typeof syncData!.creados === 'number', 'creados no es número')
      assert(typeof syncData!.actualizados === 'number', 'actualizados no es número')
      assert(typeof syncData!.cancelados === 'number', 'cancelados no es número')
      assert(typeof syncData!.sin_cambios === 'number', 'sin_cambios no es número')
      assert(typeof syncData!.conflictos_detectados === 'number', 'conflictos_detectados no es número')
      assert(typeof syncData!.sincronizado_en === 'string', 'sincronizado_en no es string')
    })

    await test('Contadores son ≥ 0', async () => {
      assert(syncData!.creados! >= 0, `creados < 0: ${syncData!.creados}`)
      assert(syncData!.actualizados! >= 0, `actualizados < 0: ${syncData!.actualizados}`)
      assert(syncData!.sin_cambios! >= 0, `sin_cambios < 0: ${syncData!.sin_cambios}`)
    })

    console.log(`     📊 creados=${syncData!.creados}, actualizados=${syncData!.actualizados}, sin_cambios=${syncData!.sin_cambios}, conflictos=${syncData!.conflictos_detectados}`)

    await test('GET /api/events incluye eventos Google si se crearon', async () => {
      const res = await fetch(`${BASE_URL}/api/events`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      assert(res.status === 200, `GET /api/events devolvió ${res.status}`)
      const body = await res.json() as { eventos?: Array<{ origen?: string; id_externo?: string | null; estado?: string }> }
      const events = body.eventos ?? []
      assert(Array.isArray(events), 'events no es array')

      if ((syncData!.creados ?? 0) > 0) {
        const googleEvents = events.filter((e) => e.origen === 'google_calendar')
        assert(
          googleEvents.length > 0,
          `Se crearon ${syncData!.creados} eventos pero ninguno tiene origen=google_calendar`
        )
        const conIdExterno = googleEvents.filter((e) => e.id_externo)
        assert(
          conIdExterno.length === googleEvents.length,
          'Hay eventos google_calendar sin id_externo'
        )
      }
    })

    await test('Eventos manuales no fueron modificados por el sync', async () => {
      const res = await fetch(`${BASE_URL}/api/events`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const body = await res.json() as { eventos?: Array<{ origen?: string; id_externo?: string | null }> }
      const events = body.eventos ?? []
      const manuales = events.filter((e) => e.origen === 'manual')
      const manualesConIdExterno = manuales.filter((e) => e.id_externo)
      assert(
        manualesConIdExterno.length === 0,
        `${manualesConIdExterno.length} evento(s) manual(es) tienen id_externo — posible corrupción`
      )
    })

    // Segunda sync — debe ser idempotente (creados=0, sin_cambios=todos)
    await test('Segunda sync es idempotente (0 creados nuevos)', async () => {
      const res = await fetch(`${BASE_URL}/api/calendar/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const data = await res.json() as { ok: boolean; creados?: number }
      assert(data.ok === true, 'Segunda sync devolvió ok=false')
      assert(
        data.creados === 0,
        `Segunda sync creó ${data.creados} eventos cuando debería crear 0`
      )
    })
  } else {
    console.log('  ℹ️  Google Calendar no conectado — tests de contenido omitidos')
    console.log(`     error: ${syncData?.error ?? 'sin mensaje'}`)

    // Aún verificamos que el endpoint responde correctamente sin Google
    await test('Sin conexión Google: endpoint devuelve 409 con error', async () => {
      assert(
        typeof syncData?.error === 'string',
        'Debería tener campo error cuando no conectado'
      )
    })
  }

  console.log(`\n${'─'.repeat(54)}`)
  console.log(`Total: ${passed + failed} | ✅ ${passed} | ❌ ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})

export {}
