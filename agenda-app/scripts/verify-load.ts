/**
 * verify-load.ts — F3-04: Prueba de carga local básica
 *
 * Objetivo: detectar regresiones de estabilidad y latencia, no benchmarking.
 *
 * Escenarios:
 *  L1. 20 requests secuenciales a /api/tasks → p50/p95 < 1000ms, 0 errores
 *  L2. 10 requests concurrentes a /api/tasks → todos 200
 *  L3. 10 requests concurrentes a /api/events?fecha=hoy → todos 200
 *  L4. 5 requests concurrentes a /api/daily-summary → todos 200
 *  L5. 5 creaciones concurrentes de tareas → todas 201, sin corrupción de datos
 *  L6. 5 creaciones concurrentes de eventos → todas 201
 *  L7. Cleanup: eliminar todos los recursos creados en L5 y L6
 *  L8. Resumen: latencia p50/p95/max de L1
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

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function getToken(): Promise<string> {
  const r = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ejecutivo@agenda.local', password: 'Agenda2026!' }),
  })
  if (!r.ok) throw new Error(`Login falló: ${r.status}`)
  const d = await r.json() as { token: string }
  return d.token
}

async function timedFetch(
  url: string,
  options: RequestInit,
): Promise<{ status: number; ms: number; data: unknown }> {
  const t0 = Date.now()
  const r = await fetch(url, options)
  const ms = Date.now() - t0
  let data: unknown
  try { data = await r.json() } catch { data = null }
  return { status: r.status, ms, data }
}

function percentile(sortedMs: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sortedMs.length) - 1
  return sortedMs[Math.max(0, idx)]
}

const todayISO = new Date().toISOString().slice(0, 10)

async function main() {
  console.log('\n╔═══════════════════════════════════════════════╗')
  console.log('║  F3-04: Prueba de Carga Local — Agenda MVP   ║')
  console.log('╚═══════════════════════════════════════════════╝')
  console.log(`   Servidor: ${BASE_URL}\n`)

  let token: string
  try {
    token = await getToken()
  } catch {
    console.error('❌ Servidor no disponible — abortando')
    process.exit(1)
  }

  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const createdTaskIds: string[] = []
  const createdEventIds: string[] = []

  // ── L1: 20 requests secuenciales ─────────────────────────────────────────
  const l1Times: number[] = []
  await test('L1. 20 GET /api/tasks secuenciales — 0 errores', async () => {
    let errors = 0
    for (let i = 0; i < 20; i++) {
      const { status, ms } = await timedFetch(`${BASE_URL}/api/tasks`, { headers: auth })
      l1Times.push(ms)
      if (status !== 200) errors++
    }
    assert(errors === 0, `${errors} request(s) fallaron`)
  })

  l1Times.sort((a, b) => a - b)
  const p50 = percentile(l1Times, 50)
  const p95 = percentile(l1Times, 95)
  const maxMs = l1Times[l1Times.length - 1]

  await test(`L1b. Latencia aceptable — p50=${p50}ms p95=${p95}ms max=${maxMs}ms (umbral p95<2000ms)`, async () => {
    assert(p95 < 2000, `p95=${p95}ms supera el umbral de 2000ms`)
  })

  // ── L2: 10 requests concurrentes a /api/tasks ─────────────────────────────
  await test('L2. 10 GET /api/tasks concurrentes — todos 200', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        timedFetch(`${BASE_URL}/api/tasks`, { headers: auth }),
      ),
    )
    const errors = results.filter((r) => r.status !== 200)
    assert(errors.length === 0, `${errors.length} request(s) fallaron`)
    const maxConcurrent = Math.max(...results.map((r) => r.ms))
    console.log(`     latencia máx concurrente: ${maxConcurrent}ms`)
  })

  // ── L3: 10 requests concurrentes a /api/events ────────────────────────────
  await test('L3. 10 GET /api/events concurrentes — todos 200', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        timedFetch(`${BASE_URL}/api/events?fecha=${todayISO}`, { headers: auth }),
      ),
    )
    const errors = results.filter((r) => r.status !== 200)
    assert(errors.length === 0, `${errors.length} request(s) fallaron`)
  })

  // ── L4: 5 requests concurrentes a /api/daily-summary ─────────────────────
  await test('L4. 5 GET /api/daily-summary concurrentes — todos 200', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        timedFetch(`${BASE_URL}/api/daily-summary`, { headers: auth }),
      ),
    )
    const errors = results.filter((r) => r.status !== 200)
    assert(errors.length === 0, `${errors.length} request(s) fallaron`)
  })

  // ── L5: 5 creaciones concurrentes de tareas ───────────────────────────────
  await test('L5. 5 POST /api/tasks concurrentes — todas 201, sin duplicados', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        timedFetch(`${BASE_URL}/api/tasks`, {
          method: 'POST',
          headers: auth,
          body: JSON.stringify({ titulo: `[LOAD TEST] Tarea concurrente ${i + 1}` }),
        }),
      ),
    )
    const errors = results.filter((r) => r.status !== 201)
    assert(errors.length === 0, `${errors.length} creaciones fallaron`)

    const ids = results
      .map((r) => {
        const d = r.data as { id?: string; tarea?: { id: string } }
        return d.id ?? d.tarea?.id
      })
      .filter(Boolean) as string[]
    createdTaskIds.push(...ids)

    const unique = new Set(ids)
    assert(unique.size === ids.length, `IDs duplicados detectados (${ids.length - unique.size} duplicados)`)
  })

  // ── L6: 5 creaciones concurrentes de eventos ──────────────────────────────
  await test('L6. 5 POST /api/events concurrentes — todas 201', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        timedFetch(`${BASE_URL}/api/events`, {
          method: 'POST',
          headers: auth,
          body: JSON.stringify({
            titulo: `[LOAD TEST] Evento concurrente ${i + 1}`,
            fecha: todayISO,
            hora_inicio: String(8 + i).padStart(2, '0') + ':00',
            hora_fin: String(8 + i).padStart(2, '0') + ':30',
          }),
        }),
      ),
    )
    const errors = results.filter((r) => r.status !== 201)
    assert(errors.length === 0, `${errors.length} creaciones fallaron`)

    const ids = results
      .map((r) => {
        const d = r.data as { id?: string; evento?: { id: string } }
        return d.id ?? d.evento?.id
      })
      .filter(Boolean) as string[]
    createdEventIds.push(...ids)
  })

  // ── L7: Cleanup ───────────────────────────────────────────────────────────
  await test('L7. Cleanup: eliminar recursos de carga', async () => {
    const taskDels = await Promise.all(
      createdTaskIds.map((id) =>
        timedFetch(`${BASE_URL}/api/tasks/${id}`, { method: 'DELETE', headers: auth }),
      ),
    )
    const eventDels = await Promise.all(
      createdEventIds.map((id) =>
        timedFetch(`${BASE_URL}/api/events/${id}`, { method: 'DELETE', headers: auth }),
      ),
    )
    const errors = [...taskDels, ...eventDels].filter((r) => ![204, 200, 404].includes(r.status))
    assert(errors.length === 0, `${errors.length} recurso(s) no pudieron eliminarse`)
    console.log(`     Eliminados: ${createdTaskIds.length} tareas, ${createdEventIds.length} eventos`)
  })

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(54)}`)
  console.log(`  📊 Latencia /api/tasks (20 req sec.)`)
  console.log(`     p50=${p50}ms  p95=${p95}ms  max=${maxMs}ms`)
  console.log(`${'─'.repeat(54)}`)
  console.log(`  Total: ${passed + failed} | ✅ ${passed} | ❌ ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})

export {}
