/**
 * verify-security.ts — F3-05: Smoke tests de seguridad OWASP MVP
 *
 * Cubre:
 *  A. Headers de seguridad
 *  B. Auth / JWT
 *  C. Rate limiting (login)
 *  D. Input sanitización + validación
 *  E. Exposición de errores
 *  F. CORS preflight
 *  G. Secretos no expuestos en respuestas
 */

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const EMAIL = process.env.EXECUTIVE_EMAIL ?? 'ejecutivo@agenda.local'
const PASSWORD = process.env.TEST_PASSWORD ?? 'Agenda2026!'

let passed = 0
let failed = 0
const failures: string[] = []

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

async function req(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; headers?: Record<string, string> } = {}
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers }
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  let data: unknown = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }
  return { status: res.status, headers: res.headers, data }
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockA() {
  console.log('\n── A — Security Headers ─────────────────────────────────')
  const r = await req('GET', '/api/calendar/status')

  assert(
    r.headers.get('x-content-type-options') === 'nosniff',
    'A1. X-Content-Type-Options: nosniff presente'
  )
  assert(
    r.headers.get('x-frame-options') === 'DENY',
    'A2. X-Frame-Options: DENY presente'
  )
  assert(
    r.headers.get('referrer-policy') === 'strict-origin-when-cross-origin',
    'A3. Referrer-Policy presente'
  )
  const csp = r.headers.get('content-security-policy') ?? ''
  assert(csp.includes("default-src 'self'"), 'A4. CSP default-src self presente')
  assert(csp.includes("frame-src 'none'"), 'A5. CSP frame-src none presente')
  assert(
    r.headers.get('x-powered-by') === null || r.headers.get('x-powered-by') === '',
    'A6. X-Powered-By eliminado'
  )
  const requestId = r.headers.get('x-request-id')
  assert(
    requestId !== null && requestId.length > 0,
    'A7. X-Request-ID presente para trazabilidad'
  )
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockB() {
  console.log('\n── B — Auth / JWT ───────────────────────────────────────')

  // B1. Login sin body → 400
  const r1 = await req('POST', '/api/auth/login')
  assert(r1.status === 400, 'B1. Login sin body → 400')

  // B2. Login con credenciales incorrectas → 401, sin detallar cuál campo falló
  const r2 = await req('POST', '/api/auth/login', { body: { email: 'x@x.com', password: 'wrong' } })
  assert(r2.status === 401, 'B2. Login mal → 401')
  const errMsg = (r2.data as { error?: string }).error ?? ''
  assert(!errMsg.toLowerCase().includes('email'), 'B3. Error login no revela si falló email o contraseña')

  // B4. Ruta protegida sin token → 401
  const r4 = await req('GET', '/api/tasks')
  assert(r4.status === 401, 'B4. GET /api/tasks sin token → 401')

  // B5. Token malformado → 401
  const r5 = await req('GET', '/api/tasks', { token: 'not.a.valid.jwt' })
  assert(r5.status === 401, 'B5. Token malformado → 401')

  // B6. Token con algoritmo none (JWT alg:none attack)
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ email: EMAIL, role: 'executive', exp: 9999999999 })).toString('base64url')
  const noneToken = `${header}.${payload}.`
  const r6 = await req('GET', '/api/tasks', { token: noneToken })
  assert(r6.status === 401, 'B6. JWT alg:none attack → 401')
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockC() {
  console.log('\n── C — Rate Limiting ────────────────────────────────────')

  // Hacer 11 logins fallidos rápidos (límite = 10 por 15 min)
  // Usar X-Forwarded-For con IP ficticia para no bloquear localhost (que usan las demás suites)
  const FAKE_IP = '10.99.88.77'
  let rateLimited = false
  for (let i = 0; i < 12; i++) {
    const r = await req('POST', '/api/auth/login', {
      body: { email: `test${i}@x.com`, password: 'wrong_pass_rate_limit_test' },
      headers: { 'X-Forwarded-For': FAKE_IP },
    })
    if (r.status === 429) {
      rateLimited = true
      const retryAfter = r.headers.get('retry-after')
      assert(retryAfter !== null && parseInt(retryAfter) > 0, 'C2. Retry-After header presente en 429')
      break
    }
  }
  assert(rateLimited, 'C1. Login rate limit → 429 tras exceder límite')
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockD(token: string) {
  console.log('\n── D — Input Sanitización y Validación ──────────────────')

  // D1. HTML en título de tarea — debe ser sanitizado o rechazado
  const r1 = await req('POST', '/api/tasks', {
    token,
    body: { titulo: '<script>alert("xss")</script>Título legítimo' },
  })
  if (r1.status === 201) {
    const t = r1.data as { titulo?: string; tarea?: { titulo: string } }
    const titulo = t.titulo ?? (t.tarea as { titulo?: string } | undefined)?.titulo ?? ''
    assert(!titulo.includes('<script>'), 'D1. HTML <script> sanitizado en título de tarea')
  } else {
    // Si rechaza el input con 400 también es aceptable
    assert(r1.status === 400, 'D1. HTML en título → 400 (validación) o sanitizado')
  }

  // D2. Título vacío → 400
  const r2 = await req('POST', '/api/tasks', { token, body: { titulo: '' } })
  assert(r2.status === 400, 'D2. Título vacío → 400')

  // D3. Título muy largo → 400
  const r3 = await req('POST', '/api/tasks', { token, body: { titulo: 'x'.repeat(201) } })
  assert(r3.status === 400, 'D3. Título > 200 chars → 400')

  // D4. Prioridad inválida → 400
  const r4 = await req('POST', '/api/tasks', {
    token,
    body: { titulo: 'Test prioridad', prioridad_manual: 'INVALID' },
  })
  assert(r4.status === 400, 'D4. Prioridad inválida → 400')

  // D5. Fecha en formato incorrecto → 400
  const r5 = await req('POST', '/api/events', {
    token,
    body: { titulo: 'Test fecha', fecha: '09/05/2026', hora_inicio: '10:00', hora_fin: '11:00' },
  })
  assert(r5.status === 400, 'D5. Fecha formato incorrecto → 400')

  // D6. hora_fin antes que hora_inicio → 400
  const r6 = await req('POST', '/api/events', {
    token,
    body: { titulo: 'Test horas', fecha: '2026-06-01', hora_inicio: '15:00', hora_fin: '14:00' },
  })
  assert(r6.status === 400, 'D6. hora_fin < hora_inicio → 400')
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockE() {
  console.log('\n── E — Exposición de Errores ────────────────────────────')

  // E1. Error interno no debe exponer stack trace
  const r1 = await req('GET', '/api/tasks/nonexistent-uuid-format')
  const body1 = r1.data as Record<string, unknown>
  assert(!('stack' in body1), 'E1. Respuesta de error no incluye stack trace')
  assert(!('detail' in body1) || typeof body1.detail !== 'string' || !body1.detail.includes('at '), 'E2. Respuesta no incluye detalles de stack internos')

  // E3. 404 en ID inexistente — formato correcto, recurso no existe
  const r3 = await req('GET', '/api/tasks/00000000-0000-0000-0000-000000000000')
  assert([404, 401].includes(r3.status), 'E3. UUID inexistente → 404 (o 401 esperado)')
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockF() {
  console.log('\n── F — CORS Preflight ───────────────────────────────────')

  const r = await req('OPTIONS', '/api/tasks', {
    headers: {
      Origin: 'https://example.com',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization',
    },
  })
  assert(
    [200, 204].includes(r.status),
    'F1. OPTIONS preflight → 200/204'
  )
  const allowMethods = r.headers.get('access-control-allow-methods') ?? ''
  assert(
    allowMethods.includes('GET') && allowMethods.includes('POST'),
    'F2. Access-Control-Allow-Methods incluye GET y POST'
  )
  assert(
    (r.headers.get('access-control-allow-headers') ?? '').toLowerCase().includes('authorization'),
    'F3. Access-Control-Allow-Headers incluye Authorization'
  )
}

// ────────────────────────────────────────────────────────────────────────────
async function runBlockG(token: string) {
  console.log('\n── G — Secretos no expuestos ────────────────────────────')

  // G1. Respuesta de login no devuelve password hash ni email del env
  const r1 = await req('POST', '/api/auth/login', {
    body: { email: EMAIL, password: PASSWORD },
  })
  const loginBody = JSON.stringify(r1.data)
  assert(!loginBody.includes('hash'), 'G1. Login response no contiene "hash"')
  assert(!loginBody.includes('EXECUTIVE_'), 'G2. Login response no contiene vars de entorno')
  assert(!loginBody.includes('JWT_SECRET'), 'G3. Login response no expone JWT_SECRET')

  // G4. Status de Google Calendar no expone tokens raw
  const r4 = await req('GET', '/api/calendar/status', { token })
  const calBody = JSON.stringify(r4.data)
  assert(!calBody.includes('access_token'), 'G4. Calendar status no expone access_token')
  assert(!calBody.includes('refresh_token'), 'G5. Calendar status no expone refresh_token')
}

// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║   F3-05: Smoke Tests de Seguridad OWASP — MVP       ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log(`   Servidor: ${BASE_URL}`)

  // Login para bloques que necesitan auth
  let token = ''
  try {
    const r = await req('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } })
    token = (r.data as { token?: string }).token ?? ''
    if (!token) throw new Error('No token en respuesta de login')
  } catch (err) {
    console.error('\n❌ No se pudo obtener token de login:', err)
    console.error('   Asegúrate de que el servidor está corriendo en', BASE_URL)
    process.exit(2)
  }

  await runBlockA()
  await runBlockB()
  await runBlockC()
  await runBlockD(token)
  await runBlockE()
  await runBlockF()
  await runBlockG(token)

  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║                   RESUMEN SEGURIDAD                 ║')
  console.log('╠══════════════════════════════════════════════════════╣')
  console.log(`║ ✅ Pasados: ${String(passed).padEnd(3)}  ❌ Fallidos: ${String(failed).padEnd(3)}               ║`)
  if (failures.length > 0) {
    console.log('║ Fallos:                                              ║')
    for (const f of failures) {
      console.log(`║  • ${f.substring(0, 48).padEnd(48)} ║`)
    }
  }
  console.log('╚══════════════════════════════════════════════════════╝\n')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(2)
})

export {}
