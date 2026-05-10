/**
 * sanitize.ts — Sanitización de input de texto y output de LLM.
 *
 * Objetivo: prevenir XSS persistente en campos de texto libre
 * (títulos, descripciones, notas) antes de persistirlos en DB,
 * y sanitizar el output de LLMs antes de renderizarlo.
 *
 * No usa librerías externas — implementación mínima para MVP.
 */

/**
 * Elimina etiquetas HTML y caracteres de control (excepto \n, \t).
 * Apropiado para títulos, descripciones y campos de texto libre.
 */
export function sanitizeText(input: string): string {
  return (
    input
      // Eliminar etiquetas HTML
      .replace(/<[^>]*>/g, '')
      // Eliminar caracteres de control (excepto \t=9, \n=10, \r=13)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim()
  )
}

/**
 * sanitizeLLMText — Sanitiza output de LLM para renderizado seguro como texto plano.
 *
 * El output de un LLM nunca debe renderizarse como HTML ni contener residuos de scripts.
 * Esta función:
 * 1. Elimina bloques <script>…</script> completos (incluyendo su contenido).
 * 2. Elimina bloques <style>…</style> completos.
 * 3. Elimina comentarios HTML.
 * 4. Elimina todas las etiquetas HTML restantes.
 * 5. Elimina protocolos peligrosos (javascript:, vbscript:, data:).
 * 6. Elimina atributos de event handlers inline (onclick=, onerror=, etc.).
 * 7. Elimina llamadas a funciones JS de inyección conocidas (alert(), eval(), etc.).
 * 8. Elimina caracteres de control.
 * 9. Normaliza espacios por línea.
 *
 * Seguro para: briefing, foco recomendado, justificaciones de tareas, recomendaciones IA.
 */
export function sanitizeLLMText(input: string): string {
  if (typeof input !== 'string') return ''

  return (
    input
      // 1. Eliminar bloques <script> completos (tag + contenido)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      // 2. Eliminar bloques <style> completos
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      // 3. Eliminar comentarios HTML
      .replace(/<!--[\s\S]*?-->/g, ' ')
      // 4. Eliminar todas las etiquetas HTML restantes
      .replace(/<[^>]*>/g, '')
      // 5. Eliminar protocolos peligrosos
      .replace(/(?:javascript|vbscript|data)\s*:/gi, '')
      // 6. Eliminar event handlers inline (onclick="...", onerror='...', onload=foo)
      .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
      .replace(/\bon\w+\s*=\s*\S+/gi, '')
      // 7. Eliminar llamadas a funciones JS peligrosas con sus argumentos
      .replace(/\b(?:alert|confirm|prompt|eval|Function|fetch|XMLHttpRequest)\s*\([^)]*\)/gi, '')
      .replace(/\bdocument\.cookie\b/gi, '')
      .replace(/\bwindow\.location\b/gi, '')
      // 8. Eliminar caracteres de control (mantener \t=9, \n=10, \r=13)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // 9. Normalizar espacios por línea y limpiar líneas vacías excesivas
      .split('\n')
      .map((line) => line.replace(/\s{2,}/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

/**
 * Sanitiza un objeto parcial: aplica sanitizeText a todos los valores
 * string del objeto. Devuelve el objeto con los valores sanitizados.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = { ...obj }
  for (const key of Object.keys(result)) {
    const val = result[key]
    if (typeof val === 'string') {
      result[key] = sanitizeText(val)
    }
  }
  return result as T
}
