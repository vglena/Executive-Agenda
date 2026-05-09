import { z } from 'zod'
import { sanitizeText } from '@/lib/security/sanitize'

const ESTADOS_EVENTO = ['activo', 'cancelado'] as const
const ORIGENES = ['manual', 'google_calendar'] as const

/** Valida formato YYYY-MM-DD */
const fechaDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido. Usa YYYY-MM-DD.')

/** Valida formato HH:MM (00:00–23:59) */
const horaTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido. Usa HH:MM (ej. 09:00).')

// ── Schemas de entrada ─────────────────────────────────────

export const CreateEventSchema = z
  .object({
    titulo: z
      .string()
      .min(1, 'El título es obligatorio.')
      .max(200, 'El título no puede superar 200 caracteres.')
      .transform(sanitizeText),
    fecha: fechaDate,
    hora_inicio: horaTime,
    hora_fin: horaTime,
    descripcion: z.string().max(2000).transform(sanitizeText).optional(),
    ubicacion: z.string().max(300).transform(sanitizeText).optional(),
    id_externo: z.string().max(500).optional(), // para futura sincronización GCal
  })
  .refine((d) => d.hora_inicio < d.hora_fin, {
    message: 'hora_fin debe ser posterior a hora_inicio.',
    path: ['hora_fin'],
  })

export const UpdateEventSchema = z
  .object({
    titulo: z.string().min(1, 'El título no puede estar vacío.').max(200).optional(),
    fecha: fechaDate.optional(),
    hora_inicio: horaTime.optional(),
    hora_fin: horaTime.optional(),
    descripcion: z.string().max(2000).nullable().optional(),
    ubicacion: z.string().max(300).nullable().optional(),
    estado: z.enum(ESTADOS_EVENTO).optional(),
  })
  .refine(
    (d) => {
      if (d.hora_inicio !== undefined && d.hora_fin !== undefined) {
        return d.hora_inicio < d.hora_fin
      }
      return true
    },
    {
      message: 'hora_fin debe ser posterior a hora_inicio.',
      path: ['hora_fin'],
    },
  )

export const EventQuerySchema = z.object({
  fecha: fechaDate.optional(),
  fecha_desde: fechaDate.optional(),
  fecha_hasta: fechaDate.optional(),
  estado: z.enum(ESTADOS_EVENTO).optional(),
})

export type CreateEventInput = z.infer<typeof CreateEventSchema>
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>

// ── Serialización de respuesta ─────────────────────────────

type RawEvent = {
  id: string
  titulo: string
  fecha: Date
  hora_inicio: string
  hora_fin: string
  descripcion: string | null
  ubicacion: string | null
  origen: string
  id_externo: string | null
  sincronizado: boolean
  conflicto_detectado: boolean
  estado: string
  created_at: Date
}

export function serializeEvent(event: RawEvent) {
  return {
    id: event.id,
    titulo: event.titulo,
    fecha: event.fecha.toISOString().split('T')[0],
    hora_inicio: event.hora_inicio,
    hora_fin: event.hora_fin,
    descripcion: event.descripcion,
    ubicacion: event.ubicacion,
    origen: event.origen,
    id_externo: event.id_externo,
    sincronizado: event.sincronizado,
    conflicto_detectado: event.conflicto_detectado,
    estado: event.estado,
    created_at: event.created_at.toISOString(),
  }
}
