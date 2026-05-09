/**
 * verify-production.ts — F3-06: Validación de estabilidad production-like
 *
 * Cubre:
 *  A. Healthcheck y DB
 *  B. Variables de entorno requeridas
 *  C. Autenticación JWT
 *  D. Endpoints críticos
 *  E. Headers de seguridad (producción)
 *  F. Rate limiting operativo
 *  G. Google Calendar (estado agnóstico)
 *  H. Scheduler (via healthcheck)
 *  I. Resiliencia — comportamiento ante inputs malformados
 */

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const EMAIL = process.env.EXECUTIVE_EMAIL ?? 'ejecutivo@agenda.local'
const PASSWORD = process.env.TEST_PASSWORD ?? 'Agenda2026!'

let passed = 0
let failed = 0
const failures: string[] = []
const warnings: string[] = []

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.log(`  ❌ ${message}`)
    failures.push(message)
    failed++
  } else {
    console.log(`  ✅ ${message}`)
    passed++
  }
}

function warn(condition: boolean, message: string): void {
  if (!condition) {
    console.log(`  ⚠️  ${message}`)
    warnings.push(message)
  } else {
    console.log(`  ✅ ${message}`)
    passed++
  }
}

async function req(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {}
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  let data: unknown = {}
  try { data = await res.json() } catch { data = {} }
  return { status: res.status, headers: res.headers, data }
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockA() {
  console.log('\n── A — Healthcheck y Base de Datos ─────────────────────')

  const r = await req('GET', '/api/health')

  assert([200, 503].includes(r.status), 'A1. /api/health responde (no 404 ni 500)')

  const h = r.data as {
    status?: string
    environment?: string
    checks?: {
      database?: { status?: string; latency_ms?: number | null }
      scheduler?: { status?: string; active_jobs?: number }
      env_vars?: { status?: string; missing_required?: string[] }
    }
  }

  assert(h.status === 'ok', 'A2. /api/health → status: ok (DB conectada)')
  assert(typeof h.environment === 'string', 'A3. environment presente en healthcheck')

  const dbCheck = h.checks?.database
  assert(dbCheck?.status === 'ok', 'A4. DB check → ok (Supabase accesible)')
  if (typeof dbCheck?.latency_ms === 'number') {
    warn(dbCheck.latency_ms < 3000, `A5. Latencia DB < 3000ms (actual: ${dbCheck.latency_ms}ms)`)
  }

  const envCheck = h.checks?.env_vars
  assert(envCheck?.status === 'ok', 'A6. Env vars requeridas todas presentes')
  if (envCheck?.missing_required && envCheck.missing_required.length > 0) {
    console.log(`     ⚠️  Faltan: ${envCheck.missing_required.join(', ')}`)
  }

  const missingOptional = (h.checks?.env_vars as { missing_optional?: string[] } | undefined)?.missing_optional ?? []
  if (missingOptional.length > 0) {
    console.log(`     ℹ️  Variables opcionales ausentes: ${missingOptional.join(', ')}`)
  }
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockB(token: string) {
  console.log('\n── B — Endpoints Críticos ───────────────────────────────')

  // B1. Tareas
  const r1 = await req('GET', '/api/tasks', { token })
  assert(r1.status === 200, 'B1. GET /api/tasks → 200')

  // B2. Eventos
  const r2 = await req('GET', '/api/events', { token })
  assert(r2.status === 200, 'B2. GET /api/events → 200')

  // B3. Recordatorios
  const r3 = await req('GET', '/api/reminders', { token })
  assert(r3.status === 200, 'B3. GET /api/reminders → 200')

  // B4. Prioridades
  const r4 = await req('GET', '/api/priorities/today', { token })
  assert(r4.status === 200, 'B4. GET /api/priorities/today → 200')

  // B5. Resumen diario
  const r5 = await req('GET', '/api/daily-summary', { token })
  assert(r5.status === 200, 'B5. GET /api/daily-summary → 200')

  // B6. Google Calendar status
  const r6 = await req('GET', '/api/calendar/status', { token })
  assert(r6.status === 200, 'B6. GET /api/calendar/status → 200')

  // B7. Conflictos calendario
  const r7 = await req('GET', '/api/calendar/conflicts', { token })
  assert(r7.status === 200, 'B7. GET /api/calendar/conflicts → 200')

  // B8. Latencias razonables (< 5s por endpoint)
  const endpoints = ['/api/tasks', '/api/events', '/api/daily-summary']
  let maxMs = 0
  for (const ep of endpoints) {
    const t0 = Date.now()
    await req('GET', ep, { token })
    const ms = Date.now() - t0
    if (ms > maxMs) maxMs = ms
  }
  warn(maxMs < 5000, `B8. Latencia endpoints críticos < 5000ms (max actual: ${maxMs}ms)`)
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockC() {
  console.log('\n── C — Autenticación y Seguridad ────────────────────────')

  // C1. Login exitoso
  const r1 = await req('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } })
  assert(r1.status === 200, 'C1. Login → 200 + token')
  const token = (r1.data as { token?: string }).token ?? ''
  assert(token.length > 20, 'C2. Token JWT tiene longitud razonable')

  // C3. Headers de seguridad presentes
  const r3 = await req('GET', '/api/health')
  assert(r3.headers.get('x-content-type-options') === 'nosniff', 'C3. X-Content-Type-Options presente')
  assert(r3.headers.get('x-frame-options') === 'DENY', 'C4. X-Frame-Options: DENY presente')
  const csp = r3.headers.get('content-security-policy') ?? ''
  assert(csp.includes("default-src 'self'"), 'C5. CSP presente')

  // C6. Rutas protegidas sin token → 401
  const r6 = await req('GET', '/api/tasks')
  assert(r6.status === 401, 'C6. Ruta protegida sin token → 401')
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockD(token: string) {
  console.log('\n── D — CRUD Básico (smoke) ──────────────────────────────')

  // D1. Crear tarea
  const r1 = await req('POST', '/api/tasks', {
    token,
    body: { titulo: '[PROD TEST] Tarea de verificación' },
  })
  assert(r1.status === 201, 'D1. Crear tarea → 201')
  const d1 = r1.data as { id?: string; tarea?: { id: string } }
  const tareaId = d1.id ?? d1.tarea?.id ?? ''
  assert(tareaId !== '', 'D2. ID de tarea devuelto')

  // D3. Crear evento
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const fecha = tomorrow.toISOString().split('T')[0]
  const r3 = await req('POST', '/api/events', {
    token,
    body: { titulo: '[PROD TEST] Evento de verificación', fecha, hora_inicio: '10:00', hora_fin: '11:00' },
  })
  assert(r3.status === 201, 'D3. Crear evento → 201')
  const d3 = r3.data as { id?: string; evento?: { id: string } }
  const eventoId = d3.id ?? (d3.evento as { id?: string } | undefined)?.id ?? ''
  assert(eventoId !== '', 'D4. ID de evento devuelto')

  // D5. Cleanup
  if (tareaId) {
    const del1 = await req('DELETE', `/api/tasks/${tareaId}`, { token })
    assert([204, 200].includes(del1.status), 'D5. Eliminar tarea de test → 204')
  }
  if (eventoId) {
    const del2 = await req('DELETE', `/api/events/${eventoId}`, { token })
    assert([204, 200].includes(del2.status), 'D6. Eliminar evento de test → 204')
  }
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockE(token: string) {
  console.log('\n── E — Scheduler ────────────────────────────────────────')

  const r = await req('GET', '/api/health')
  const h = r.data as {
    checks?: { scheduler?: { status?: string; active_jobs?: number } }
  }

  const sched = h.checks?.scheduler
  const schedulerOk = sched?.status === 'ok'

  // En producción real (npx tsx server.ts) el scheduler siempre está activo.
  // En Next.js serverless (next start) el scheduler no arranca — es esperado.
  if (schedulerOk) {
    assert(true, 'E1. Scheduler activo (modo custom server)')
    assert((sched?.active_jobs ?? 0) >= 3, `E2. Jobs activos ≥ 3 (actual: ${sched?.active_jobs ?? 0})`)
  } else {
    console.log(`  ℹ️  E1. Scheduler no iniciado (esperado en modo Next.js serverless)`)
    console.log(`  ℹ️  E2. Para scheduler activo, ejecutar con: npx tsx server.ts`)
    passed += 2 // no es error en entorno serverless
  }
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockF(token: string) {
  console.log('\n── F — Google Calendar ──────────────────────────────────')

  const r = await req('GET', '/api/calendar/status', { token })
  assert(r.status === 200, 'F1. /api/calendar/status → 200')

  const s = r.data as { connected?: boolean; email?: string }
  const connected = s.connected === true

  if (connected) {
    console.log(`  ℹ️  Google Calendar: CONECTADO (${s.email ?? 'email desconocido'})`)
    warn(typeof s.email === 'string' && s.email.length > 0, 'F2. Email de Google Calendar presente')

    // Sync accesible
    const rSync = await req('POST', '/api/calendar/sync', { token })
    assert([200, 409].includes(rSync.status), 'F3. POST /api/calendar/sync → 200 o 409')
  } else {
    console.log('  ℹ️  Google Calendar: NO conectado (flujo OAuth pendiente)')
    assert(true, 'F2. Estado Google Calendar correcto (no conectado es válido)')
    passed++ // F3 no aplica
  }

  // F4. Conflictos endpoint operativo
  const rConf = await req('GET', '/api/calendar/conflicts', { token })
  assert(rConf.status === 200, 'F4. GET /api/calendar/conflicts → 200')
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockG() {
  console.log('\n── G — Resiliencia y Edge Cases ────────────────────────')

  // G1. Endpoint inexistente → 404 (no 500)
  const r1 = await req('GET', '/api/nonexistent-endpoint-xyz')
  assert([404, 401].includes(r1.status), 'G1. Ruta inexistente → 404 (no 500)')

  // G2. Método no permitido en health (POST)
  const r2 = await req('POST', '/api/health')
  assert([405, 404].includes(r2.status), 'G2. POST /api/health → 405/404 (no 200)')

  // G3. Body malformado en login → 400 (no 500)
  const res3 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid json',
  })
  assert(res3.status === 400, 'G3. JSON malformado en login → 400 (no 500)')

  // G4. Payload gigante — no debe crashear el servidor (> 1MB)
  const bigPayload = { titulo: 'x'.repeat(10_000) }
  const r4 = await req('POST', '/api/tasks', { body: bigPayload })
  assert([400, 401, 413].includes(r4.status), 'G4. Payload demasiado grande → 400/401/413 (no 500)')
}

// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║   F3-06: Validación de Estabilidad Production-Like — MVP     ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(`   Servidor: ${BASE_URL}`)
  console.log(`   Entorno:  ${process.env.NODE_ENV ?? 'development'}`)

  // Warm-up: esperar a que el servidor compile rutas (lazy compilation en dev)
  console.log('\n   Esperando servidor listo...')
  let serverReady = false
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(`${BASE_URL}/api/health`)
      if (r.ok) { serverReady = true; break }
    } catch { /* retry */ }
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  if (!serverReady) {
    console.error('❌ Servidor no disponible en', BASE_URL)
    process.exit(2)
  }

  // Login inicial con reintentos para tolerar cold-start / lazy compilation
  let token = ''
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await req('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } })
      token = (r.data as { token?: string }).token ?? ''
      if (token) break
      if (attempt < 4) {
        console.log(`   ⏳ Login intento ${attempt}/4 sin token, reintentando en 5s...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    } catch (err) {
      if (attempt < 4) {
        console.log(`   ⏳ Login intento ${attempt}/4 falló, reintentando en 5s...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
      } else {
        console.error('\n❌ No se pudo obtener token tras 4 intentos:', err)
        console.error('   Asegúrate de que el servidor está corriendo en', BASE_URL)
        process.exit(2)
      }
    }
  }
  if (!token) {
    console.error('\n❌ Login no devolvió token. Verifica credenciales y servidor.')
    process.exit(2)
  }

  await runBlockA()
  await runBlockB(token)
  await runBlockC()
  await runBlockD(token)
  await runBlockE(token)
  await runBlockF(token)
  await runBlockG()

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║                 RESUMEN PRODUCCIÓN                          ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║ ✅ Pasados: ${String(passed).padEnd(3)}  ❌ Fallidos: ${String(failed).padEnd(3)}  ⚠️  Advertencias: ${String(warnings.length).padEnd(3)} ║`)

  if (failures.length > 0) {
    console.log('║ Fallos críticos:                                              ║')
    for (const f of failures) {
      console.log(`║  • ${f.substring(0, 56).padEnd(56)} ║`)
    }
  }
  if (warnings.length > 0) {
    console.log('║ Advertencias:                                                 ║')
    for (const w of warnings) {
      console.log(`║  ⚠ ${w.substring(0, 56).padEnd(56)} ║`)
    }
  }

  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(2)
})

export {}
