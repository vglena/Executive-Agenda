// LLMAdapter — interface que desacopla el resto del sistema del proveedor LLM concreto.
// Para cambiar de OpenAI a Anthropic/Gemini: implementar esta interface y ajustar
// la variable de entorno LLM_PROVIDER.

export interface TaskWithScore {
  id: string
  titulo: string
  fecha_limite: Date | null
  prioridad_manual: string
  score: number
}

export interface SummaryContext {
  fecha: string              // "YYYY-MM-DD"
  eventos: Array<{
    titulo: string
    hora_inicio: string
    hora_fin: string
  }>
  tareas_prioritarias: Array<{
    titulo: string
    fecha_limite: string | null
    prioridad_manual: string
  }>
  tareas_vencidas: Array<{
    titulo: string
    fecha_limite: string
  }>
}

export interface LLMAdapter {
  /**
   * Genera una justificación en 1 frase por cada tarea del ranking del día.
   * Retorna un mapa { taskId → justificación }.
   */
  generateJustifications(tasks: TaskWithScore[]): Promise<Record<string, string>>

  /**
   * Genera el cuerpo del resumen diario (≤300 palabras, 4 bloques).
   */
  generateDailySummary(context: SummaryContext): Promise<string>

  /**
   * Genera 1 frase de sugerencia práctica para el día.
   */
  generateDaySuggestion(context: SummaryContext): Promise<string>
}
