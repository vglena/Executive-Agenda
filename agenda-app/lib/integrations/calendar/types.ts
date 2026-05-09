// CalendarProvider — interface que desacopla el sistema del proveedor de calendario externo.
// El sistema funciona íntegramente con NullCalendarAdapter (sin Google Calendar conectado).
// Para conectar Google: usar GoogleCalendarAdapter.

export interface CalendarEvent {
  externalId: string
  titulo: string
  fecha: string        // "YYYY-MM-DD"
  horaInicio: string   // "HH:MM"
  horaFin: string      // "HH:MM"
  descripcion?: string
}

export interface CalendarProvider {
  /**
   * Verifica si el proveedor externo está conectado y con tokens válidos.
   */
  isConnected(): Promise<boolean>

  /**
   * Obtiene los eventos del proveedor externo en el rango de fechas indicado.
   */
  getEvents(from: Date, to: Date): Promise<CalendarEvent[]>

  /**
   * Desconecta el proveedor y borra los tokens almacenados.
   */
  disconnect(): Promise<void>
}
