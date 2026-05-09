/**
 * sanitize.ts — Sanitización básica de input de texto.
 *
 * Objetivo: prevenir XSS persistente en campos de texto libre
 * (títulos, descripciones, notas) antes de persistirlos en DB.
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
