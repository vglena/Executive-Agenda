import 'dotenv/config'
import { calcularScore } from '@/lib/services/priorities.service'
import { getLLMAdapter, NullLLMAdapter } from '@/lib/ai'
import type { TaskWithScore, SummaryContext } from '@/lib/ai'

let passed = 0
let failed = 0

function ok(label: string) {
  console.log(`  [OK] ${label}`)
  passed++
}

function fail(label: string, detail?: string) {
  console.error(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`)
  failed++
}

function dateInDays(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

async function main() {
  // ── 1. calcularScore ────────────────────────────────────────────────────────

  console.log('\n1. calcularScore (fórmula determinista)\n')

  {
    // Pesos default (0.5 / 0.3 / 0.2), 2 eventos → cargaPenalizacion = min(1, 3) = 1
    // T1: P1, +1d → urgencia=9, impacto=4  → 9*0.5 + 4*0.3 + 1*0.2 = 5.9
    // T2: P2, +7d → urgencia=3, impacto=3  → 3*0.5 + 3*0.3 + 1*0.2 = 2.6
    // T3: P3, null → urgencia=3, impacto=2 → 3*0.5 + 2*0.3 + 1*0.2 = 2.3

    const t1 = calcularScore({ fecha_limite: dateInDays(1), prioridad_manual: 'P1' }, 2)
    const t2 = calcularScore({ fecha_limite: dateInDays(7), prioridad_manual: 'P2' }, 2)
    const t3 = calcularScore({ fecha_limite: null, prioridad_manual: 'P3' }, 2)

    console.log(`  T1 (P1, +1d):   score = ${t1.toFixed(3)}  (esperado 5.900)`)
    console.log(`  T2 (P2, +7d):   score = ${t2.toFixed(3)}  (esperado 2.600)`)
    console.log(`  T3 (P3, null):  score = ${t3.toFixed(3)}  (esperado 2.300)`)

    t1 > t2 ? ok('T1 > T2') : fail('T1 > T2', `${t1} vs ${t2}`)
    t2 > t3 ? ok('T2 > T3') : fail('T2 > T3', `${t2} vs ${t3}`)

    const TOLERANCE = 0.001
    Math.abs(t1 - 5.9) < TOLERANCE ? ok('T1 = 5.9 exacto') : fail('T1 exacto', `got ${t1}`)
    Math.abs(t2 - 2.6) < TOLERANCE ? ok('T2 = 2.6 exacto') : fail('T2 exacto', `got ${t2}`)
    Math.abs(t3 - 2.3) < TOLERANCE ? ok('T3 = 2.3 exacto') : fail('T3 exacto', `got ${t3}`)
  }

  {
    // Tarea vencida (ayer) → urgencia = max(0, 10-(-1)) = 11 → score > T1
    const vencida = calcularScore({ fecha_limite: dateInDays(-1), prioridad_manual: 'P1' }, 0)
    const manana  = calcularScore({ fecha_limite: dateInDays(1), prioridad_manual: 'P1' }, 2)
    vencida > manana
      ? ok('Tarea vencida tiene score mayor que tarea que vence mañana')
      : fail('Vencida > mañana', `${vencida} vs ${manana}`)
  }

  {
    // Más eventos → cargaPenalizacion mayor → score mayor (diseño intencional)
    const sinEventos = calcularScore({ fecha_limite: dateInDays(5), prioridad_manual: 'P2' }, 0)
    const conEventos = calcularScore({ fecha_limite: dateInDays(5), prioridad_manual: 'P2' }, 6)
    conEventos > sinEventos
      ? ok('Más eventos → score mayor (carga empuja hacia arriba)')
      : fail('Carga por eventos', `sin=${sinEventos} con=${conEventos}`)
  }

  // ── 2. NullLLMAdapter ───────────────────────────────────────────────────────

  console.log('\n2. NullLLMAdapter (fallback local)\n')

  const adapter = new NullLLMAdapter()

  {
    const tasks: TaskWithScore[] = [
      { id: 'a', titulo: 'Informe Q2', fecha_limite: dateInDays(0), prioridad_manual: 'P1', score: 8.5 },
      { id: 'b', titulo: 'Revisar contratos', fecha_limite: dateInDays(2), prioridad_manual: 'P2', score: 4.1 },
      { id: 'c', titulo: 'Actualizar deck', fecha_limite: null, prioridad_manual: 'P3', score: 2.3 },
    ]

    const just = await adapter.generateJustifications(tasks)

    Object.keys(just).length === 3
      ? ok('generateJustifications → 3 entradas')
      : fail('count justificaciones', `${Object.keys(just).length}`)

    just['a']?.toLowerCase().includes('hoy')
      ? ok('Vence hoy → justificación menciona "hoy"')
      : fail('Justificación hoy', just['a'])

    just['b']?.includes('días')
      ? ok('Vence en 2 días → justificación menciona "días"')
      : fail('Justificación 2 días', just['b'])

    typeof just['c'] === 'string' && just['c'].length > 0
      ? ok('Sin deadline → justificación no vacía')
      : fail('Justificación sin deadline', just['c'])

    console.log('  Justificaciones:')
    tasks.forEach((t) => console.log(`    [${t.id}] ${just[t.id]}`))
  }

  {
    const ctx: SummaryContext = {
      fecha: new Date().toISOString().split('T')[0],
      eventos: [{ titulo: 'Reunión de equipo', hora_inicio: '09:00', hora_fin: '10:00' }],
      tareas_prioritarias: [{ titulo: 'Informe Q2', fecha_limite: null, prioridad_manual: 'P1' }],
      tareas_vencidas: [],
    }

    const resumen = await adapter.generateDailySummary(ctx)
    ;[
      ['## Reuniones del día', 'bloque Reuniones'],
      ['## Tareas prioritarias', 'bloque Tareas'],
      ['## Alertas y vencidos', 'bloque Alertas'],
      ['## Foco recomendado', 'bloque Foco'],
      ['Reunión de equipo', 'evento en resumen'],
    ].forEach(([needle, label]) =>
      resumen.includes(needle) ? ok(label!) : fail(label!, `no encontrado en resumen`)
    )

    const sug = await adapter.generateDaySuggestion(ctx)
    typeof sug === 'string' && sug.length > 10
      ? ok(`generateDaySuggestion → "${sug}"`)
      : fail('generateDaySuggestion', sug)
  }

  {
    const sugVacia = await adapter.generateDaySuggestion({
      fecha: '2026-05-09', eventos: [], tareas_prioritarias: [], tareas_vencidas: [],
    })
    sugVacia.toLowerCase().includes('sin reuniones') || sugVacia.toLowerCase().includes('profundo')
      ? ok('Sin reuniones → sugerencia de trabajo profundo')
      : fail('Sugerencia sin reuniones', sugVacia)
  }

  // ── 3. getLLMAdapter factory ────────────────────────────────────────────────

  console.log('\n3. getLLMAdapter factory\n')

  {
    const saved = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    const fallback = getLLMAdapter()
    fallback instanceof NullLLMAdapter
      ? ok('Sin OPENAI_API_KEY → NullLLMAdapter')
      : fail('Factory sin key', fallback?.constructor?.name)
    if (saved) process.env.OPENAI_API_KEY = saved
  }

  {
    process.env.OPENAI_API_KEY = 'sk-test-fake-for-type-check'
    const { OpenAIAdapter } = await import('@/lib/ai/openai.adapter')
    const openai = getLLMAdapter()
    openai instanceof OpenAIAdapter
      ? ok('Con OPENAI_API_KEY → OpenAIAdapter')
      : fail('Factory con key', openai?.constructor?.name)
    delete process.env.OPENAI_API_KEY
  }

  // ── Resultado ───────────────────────────────────────────────────────────────

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Resultado: ${passed} OK  |  ${failed} FAIL`)
  console.log(`${'─'.repeat(50)}\n`)

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('[ERROR]', err)
  process.exit(1)
})
