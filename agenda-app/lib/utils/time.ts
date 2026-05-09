/**
 * lib/utils/time.ts — Utilidades de tiempo para comparaciones con zona horaria.
 */

/**
 * Devuelve la hora y minuto actuales en la zona horaria indicada.
 * Usa Intl.DateTimeFormat (built-in Node.js, sin dependencias externas).
 *
 * @example
 * getLocalTime('America/Mexico_City') // { hours: 7, minutes: 30 }
 */
export function getLocalTime(timezone: string): { hours: number; minutes: number } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)

  const hours   = parseInt(parts.find((p) => p.type === 'hour')?.value   ?? '0', 10)
  const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10)

  // Intl puede devolver 24 cuando son las 00:xx (medianoche)
  return { hours: hours === 24 ? 0 : hours, minutes }
}

/**
 * Devuelve la fecha local (sin hora) en la zona horaria indicada.
 * Útil para comparar "hoy" en la tz del ejecutivo, no del servidor.
 *
 * @example
 * getTodayInTimezone('America/Mexico_City') // Date @ 00:00:00 local
 */
export function getTodayInTimezone(timezone: string): Date {
  const now = new Date()
  const localStr = now.toLocaleDateString('en-CA', { timeZone: timezone }) // "YYYY-MM-DD"
  return new Date(`${localStr}T00:00:00.000Z`)
}
