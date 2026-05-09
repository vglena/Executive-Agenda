import { z } from 'zod'

export const ANTELACION_TIPOS = ['15min', '30min', '1h', '3h', '1dia', 'personalizado'] as const
const ESTADOS_REMINDER = ['activo', 'disparado', 'cancelado'] as const
const ENTIDAD_TIPOS = ['tarea', 'evento'] as const

/**
 * Schema para crear un recordatorio.
 *
 * Reglas:
 * - task_id y event_id son mutuamente excluyentes — exactamente uno o ninguno
 * - antelacion_tipo === "personalizado" requiere fecha_hora_disparo explícita
 * - Para "15min","30min","1h","3h","1dia" la fecha_hora_disparo puede omitirse
 *   y se calculará en el handler a partir de la fecha de la tarea/evento
 */
export const CreateReminderSchema = z
  .object({
    task_id: z.string().uuid('task_id debe ser un UUID válido.').optional(),
    event_id: z.string().uuid('event_id debe ser un UUID válido.').optional(),
    antelacion_tipo: z.enum(ANTELACION_TIPOS),
    fecha_hora_disparo: z
      .string()
      .datetime({ message: 'fecha_hora_disparo debe ser ISO 8601 (ej. 2026-06-01T09:00:00Z).' })
      .optional(),
    mensaje: z.string().max(500).optional(),
  })
  .refine((d) => !(d.task_id && d.event_id), {
    message: 'Indica solo task_id o event_id, no ambos.',
    path: ['task_id'],
  })
  .refine((d) => d.antelacion_tipo !== 'personalizado' || d.fecha_hora_disparo !== undefined, {
    message: 'antelacion_tipo "personalizado" requiere fecha_hora_disparo.',
    path: ['fecha_hora_disparo'],
  })

export const UpdateReminderSchema = z.object({
  fecha_hora_disparo: z
    .string()
    .datetime({ message: 'Debe ser ISO 8601 (ej. 2026-06-01T09:00:00Z).' })
    .optional(),
  mensaje: z.string().max(500).nullable().optional(),
  estado: z.enum(ESTADOS_REMINDER).optional(),
})

export const ReminderQuerySchema = z.object({
  estado: z.enum(ESTADOS_REMINDER).optional(),
  fecha_desde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa YYYY-MM-DD.')
    .optional(),
  fecha_hasta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa YYYY-MM-DD.')
    .optional(),
})

export type CreateReminderInput = z.infer<typeof CreateReminderSchema>
export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>

// ── Helpers ────────────────────────────────────────────────

/** Devuelve la diferencia en ms para cada tipo de antelación */
export const ANTELACION_MS: Record<string, number> = {
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '1dia': 24 * 60 * 60 * 1000,
}

// ── Serialización ──────────────────────────────────────────

type RawReminder = {
  id: string
  entidad_tipo: string
  task_id: string | null
  event_id: string | null
  antelacion_tipo: string
  fecha_hora_disparo: Date
  mensaje: string | null
  origen: string
  estado: string
}

export function serializeReminder(r: RawReminder) {
  return {
    id: r.id,
    entidad_tipo: r.entidad_tipo,
    task_id: r.task_id,
    event_id: r.event_id,
    antelacion_tipo: r.antelacion_tipo,
    fecha_hora_disparo: r.fecha_hora_disparo.toISOString(),
    mensaje: r.mensaje,
    origen: r.origen,
    estado: r.estado,
  }
}
