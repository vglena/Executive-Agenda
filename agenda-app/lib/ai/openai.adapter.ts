import OpenAI from 'openai'
import type { LLMAdapter, SummaryContext, TaskWithScore } from './types'

export class OpenAIAdapter implements LLMAdapter {
  private client: OpenAI
  private model: string

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no esta configurada en las variables de entorno.')
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.model = process.env.LLM_MODEL ?? 'gpt-4o-mini'
  }

  async generateJustifications(tasks: TaskWithScore[]): Promise<Record<string, string>> {
    if (tasks.length === 0) return {}

    const taskList = tasks
      .map(
        (t, i) =>
          `${i + 1}. "${t.titulo}" | deadline: ${t.fecha_limite?.toISOString().split('T')[0] ?? 'sin fecha'} | señal_manual_secundaria: ${t.prioridad_manual} | score_operativo: ${t.score.toFixed(2)}`
      )
      .join('\n')

    const prompt = `Eres el asistente de un ejecutivo. Para cada tarea del foco de hoy, escribe UNA frase directa y concreta explicando por qué requiere atención operativa. Prioriza deadline, proximidad temporal, carga del día, conflictos y recordatorios; la señal manual es secundaria. Sin rodeos, sin repetir el título completo.

Tareas:
${taskList}

Responde SOLO con un JSON válido con este formato exacto:
{ "1": "frase para tarea 1", "2": "frase para tarea 2", ... }`

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as Record<string, string>

    const result: Record<string, string> = {}
    tasks.forEach((t, i) => {
      result[t.id] = parsed[String(i + 1)] ?? ''
    })
    return result
  }

  async generateDailySummary(context: SummaryContext): Promise<string> {
    const prompt = `Eres el asistente personal de un ejecutivo. Genera el resumen diario de hoy (${context.fecha}) en EXACTAMENTE 4 bloques, máximo 300 palabras en total.

DATOS DEL DÍA:
Reuniones (${context.eventos.length}): ${context.eventos.map((e) => `${e.hora_inicio}-${e.hora_fin} ${e.titulo}`).join(', ') || 'Ninguna'}
Foco operativo: ${context.tareas_prioritarias.map((t) => t.titulo).join(', ') || 'Ninguno'}
Tareas vencidas: ${context.tareas_vencidas.map((t) => t.titulo).join(', ') || 'Ninguna'}

BLOQUES REQUERIDOS (usa estos encabezados exactos):
## Reuniones del día
## Foco operativo
## Alertas y vencidos
## Foco recomendado

Sé directo, ejecutivo y útil. Sin relleno.`

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 500,
    })

    return response.choices[0]?.message?.content?.trim() ?? ''
  }

  async generateDaySuggestion(context: SummaryContext): Promise<string> {
    const prompt = `Eres el asistente de un ejecutivo. En UNA sola frase práctica y concreta (máximo 20 palabras), da el consejo más útil para que el ejecutivo optimice su día de hoy.

Agenda: ${context.eventos.length} reuniones. Foco operativo: ${context.tareas_prioritarias.map((t) => t.titulo).join(', ') || 'ninguno'}.

Solo la frase, sin comillas, sin explicación.`

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 60,
    })

    return response.choices[0]?.message?.content?.trim() ?? ''
  }
}
