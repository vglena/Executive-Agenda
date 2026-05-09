import type { LLMAdapter, SummaryContext, TaskWithScore } from './types'

/**
 * NullLLMAdapter - fallback local cuando OPENAI_API_KEY no esta configurada.
 * Genera texto determinista a partir de los datos disponibles, sin llamadas externas.
 */
export class NullLLMAdapter implements LLMAdapter {
  async generateJustifications(tasks: TaskWithScore[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {}
    for (const task of tasks) {
      result[task.id] = buildJustification(task)
    }
    return result
  }

  async generateDailySummary(context: SummaryContext): Promise<string> {
    const reuniones =
      context.eventos.length === 0
        ? 'Sin reuniones programadas.'
        : context.eventos.map((e) => `- ${e.hora_inicio}-${e.hora_fin} ${e.titulo}`).join('\n')

    const focoOperativo =
      context.tareas_prioritarias.length === 0
        ? 'Sin tareas en foco identificadas.'
        : context.tareas_prioritarias.map((t, i) => `${i + 1}. ${t.titulo}`).join('\n')

    const vencidas =
      context.tareas_vencidas.length === 0
        ? 'Sin tareas vencidas.'
        : context.tareas_vencidas.map((t) => `- ${t.titulo} (venció ${t.fecha_limite})`).join('\n')

    const foco = context.tareas_prioritarias[0]?.titulo
      ? `Enfocar la primera hora disponible en: ${context.tareas_prioritarias[0].titulo}.`
      : 'Revisar la bandeja de entrada y despejar lo que requiera atención hoy.'

    return [
      `## Reuniones del día`,
      reuniones,
      ``,
      `## Foco operativo`,
      focoOperativo,
      ``,
      `## Alertas y vencidos`,
      vencidas,
      ``,
      `## Foco recomendado`,
      foco,
    ].join('\n')
  }

  async generateDaySuggestion(context: SummaryContext): Promise<string> {
    const n = context.eventos.length
    if (n === 0) return 'Día sin reuniones: buen bloque para avanzar en lo que requiera atención.'
    if (n <= 2) return 'Pocos compromisos hoy: despeja primero el foco operativo.'
    if (n <= 4) return 'Día cargado: usa bloques cortos para cerrar lo sensible.'
    return 'Agenda muy densa: protege lo urgente y desplaza lo que pueda esperar.'
  }
}

function buildJustification(task: TaskWithScore): string {
  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)

  const dias =
    task.fecha_limite !== null
      ? Math.floor((task.fecha_limite.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
      : null

  if (dias !== null && dias < 0) return 'Está atrasada: requiere acción inmediata.'
  if (dias !== null && dias === 0) return 'Vence hoy: conviene resolverla antes del cierre del día.'
  if (dias !== null && dias === 1) return 'Vence mañana: adelantarla hoy reduce presión.'
  if (dias !== null && dias <= 3) return `Vence en ${dias} días: aparece en foco por proximidad.`
  if (task.score >= 5) return 'Requiere atención por combinación de fecha, carga del día y señales próximas.'
  return 'Aparece en foco por relevancia operativa del día.'
}
