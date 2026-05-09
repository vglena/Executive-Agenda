import type { CalendarEvent, CalendarProvider } from './types'

/**
 * NullCalendarAdapter — adaptador por defecto cuando Google Calendar no está conectado.
 * Nunca lanza errores: el sistema opera normalmente sin integración externa.
 */
export class NullCalendarAdapter implements CalendarProvider {
  async isConnected(): Promise<boolean> {
    return false
  }

  async getEvents(_from: Date, _to: Date): Promise<CalendarEvent[]> {
    return []
  }

  async disconnect(): Promise<void> {
    // Nada que hacer — no hay conexión activa
  }
}
