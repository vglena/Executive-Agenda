import { prisma } from '@/lib/db'
import { detectAndSaveConflicts } from '@/lib/services/conflict.service'

// ── Rango de sincronización ────────────────────────────────────────────────
const SYNC_DAYS_PAST = 7
const SYNC_DAYS_FUTURE = 30

export interface SyncResult {
  sincronizado_en: string   // ISO
  creados: number
  actualizados: number
  cancelados: number
  sin_cambios: number
  conflictos_detectados: number
  error?: string
}

/**
 * syncGoogleCalendarToDB — sincronización unidireccional Google Calendar → DB.
 *
 * Flujo:
 *  1. Carga GoogleCalendarAdapter. Si no hay tokens → devuelve resultado vacío.
 *  2. Obtiene eventos de Google en rango [hoy-7d, hoy+30d].
 *  3. Por cada evento: upsert por id_externo.
 *     - Nuevo → crear con origen='google_calendar', detectar conflicto con manuales.
 *     - Existente → actualizar campos mutables; marcar cancelado si Google devuelve cancelado.
 *  4. Nunca toca eventos con origen='manual'.
 *  5. No elimina eventos — solo marca como cancelado.
 *
 * @param isManualTrigger  Si true: lanza errores de Google al caller.
 *                         Si false (cron): traga errores y devuelve result con error.
 */
export async function syncGoogleCalendarToDB(
  isManualTrigger = false
): Promise<SyncResult> {
  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - SYNC_DAYS_PAST)
  const to = new Date(now)
  to.setDate(to.getDate() + SYNC_DAYS_FUTURE)

  const result: SyncResult = {
    sincronizado_en: now.toISOString(),
    creados: 0,
    actualizados: 0,
    cancelados: 0,
    sin_cambios: 0,
    conflictos_detectados: 0,
  }

  // Cargar adapter dinámicamente — evita romper el build si googleapis no está disponible
  let adapter
  try {
    const { GoogleCalendarAdapter } = await import(
      '@/lib/integrations/calendar/google.adapter'
    )
    adapter = new GoogleCalendarAdapter()
  } catch (err) {
    result.error = 'GoogleCalendarAdapter no disponible.'
    return result
  }

  const connected = await adapter.isConnected()
  if (!connected) {
    result.error = 'Google Calendar no conectado.'
    return result
  }

  let externalEvents
  try {
    externalEvents = await adapter.getEvents(from, to)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isManualTrigger) throw err
    result.error = `Error al obtener eventos de Google: ${message}`
    return result
  }

  for (const ev of externalEvents) {
    try {
      const fechaDate = new Date(ev.fecha + 'T00:00:00.000Z')

      // Buscar si ya existe en DB por id_externo
      const existing = await prisma.event.findUnique({
        where: { id_externo: ev.externalId },
      })

      if (!existing) {
        // ── Nuevo evento desde Google ───────────────────────────────────
        // Crear primero — necesitamos el ID para registrar el conflicto
        const created = await prisma.event.create({
          data: {
            titulo: ev.titulo,
            fecha: fechaDate,
            hora_inicio: ev.horaInicio,
            hora_fin: ev.horaFin,
            descripcion: ev.descripcion,
            origen: 'google_calendar',
            id_externo: ev.externalId,
            sincronizado: true,
            conflicto_detectado: false, // se actualiza abajo
            estado: 'activo',
          },
        })

        const { conflicto, nuevos } = await detectAndSaveConflicts(
          created.id,
          fechaDate,
          ev.horaInicio,
          ev.horaFin,
        )

        if (conflicto) {
          await prisma.event.update({
            where: { id: created.id },
            data: { conflicto_detectado: true },
          })
        }

        result.creados++
        result.conflictos_detectados += nuevos
      } else {
        // ── Evento existente — solo actualizar si hay cambios ──────────
        // Nunca tocar eventos manuales (origen='manual')
        if (existing.origen === 'manual') {
          result.sin_cambios++
          continue
        }

        const cambiado =
          existing.titulo !== ev.titulo ||
          existing.hora_inicio !== ev.horaInicio ||
          existing.hora_fin !== ev.horaFin ||
          (existing.descripcion ?? undefined) !== ev.descripcion

        if (!cambiado && existing.estado !== 'cancelado') {
          result.sin_cambios++
          continue
        }

        // Re-detectar conflicto si cambia el horario
        let tieneConflicto = existing.conflicto_detectado
        let nuevosConflictos = 0
        if (existing.hora_inicio !== ev.horaInicio || existing.hora_fin !== ev.horaFin) {
          const res = await detectAndSaveConflicts(
            existing.id,
            fechaDate,
            ev.horaInicio,
            ev.horaFin,
          )
          tieneConflicto = res.conflicto
          nuevosConflictos = res.nuevos
        }

        await prisma.event.update({
          where: { id: existing.id },
          data: {
            titulo: ev.titulo,
            hora_inicio: ev.horaInicio,
            hora_fin: ev.horaFin,
            descripcion: ev.descripcion ?? null,
            sincronizado: true,
            conflicto_detectado: tieneConflicto,
            estado: 'activo',
          },
        })

        result.actualizados++
        result.conflictos_detectados += nuevosConflictos
      }
    } catch (err) {
      // Error en un evento individual — continuar con los demás
      console.error(`[calendar-sync] Error procesando evento ${ev.externalId}:`, err)
    }
  }

  return result
}

/**
 * markGoogleEventCancelled — marca como cancelado un evento de Google que ya no
 * aparece en el feed (llamada explícita, no automática en sync).
 * Nunca toca eventos manuales.
 */
export async function markGoogleEventCancelled(idExterno: string): Promise<void> {
  await prisma.event.updateMany({
    where: { id_externo: idExterno, origen: 'google_calendar' },
    data: { estado: 'cancelado' },
  })
}

/**
 * syncCalendar — wrapper para el scheduler (cron cada 15 min).
 * Versión silenciosa: nunca lanza, solo loguea.
 */
export async function syncCalendar(): Promise<void> {
  const result = await syncGoogleCalendarToDB(false)
  if (result.error) {
    // No es un error real si Google no está conectado
    if (!result.error.includes('no conectado')) {
      console.error('[calendar-sync] Error en sync automático:', result.error)
    }
    return
  }
  const { creados, actualizados, cancelados, conflictos_detectados } = result
  if (creados + actualizados + cancelados > 0) {
    console.log(
      `[calendar-sync] Sync completado — creados: ${creados}, actualizados: ${actualizados}, cancelados: ${cancelados}, conflictos: ${conflictos_detectados}`
    )
  }
}

