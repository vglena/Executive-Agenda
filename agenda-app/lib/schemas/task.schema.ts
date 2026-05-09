import { z } from 'zod'
import { sanitizeText } from '@/lib/security/sanitize'

const PRIORIDADES = ['P1', 'P2', 'P3', 'P4'] as const
const ESTADOS = ['pendiente', 'completada'] as const

/** Valida formato YYYY-MM-DD sin importar librerías de fechas */
const fechaDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido. Usa YYYY-MM-DD.')

// ── Schemas de entrada ─────────────────────────────────────

export const CreateTaskSchema = z.object({
  titulo: z
    .string()
    .min(1, 'El título es obligatorio.')
    .max(200, 'El título no puede superar 200 caracteres.')
    .transform(sanitizeText),
  descripcion: z.string().max(2000).transform(sanitizeText).optional(),
  fecha_limite: fechaDate.optional(),
  prioridad_manual: z.enum(PRIORIDADES).default('P3'),
  estado: z.enum(ESTADOS).default('pendiente'),
})

export const UpdateTaskSchema = z.object({
  titulo: z.string().min(1, 'El título no puede estar vacío.').max(200).optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  fecha_limite: fechaDate.nullable().optional(),
  prioridad_manual: z.enum(PRIORIDADES).optional(),
  estado: z.enum(ESTADOS).optional(),
})

export const TaskQuerySchema = z.object({
  estado: z.enum(ESTADOS).optional(),
  fecha_limite_antes: fechaDate.optional(),
  fecha_limite_despues: fechaDate.optional(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>

// ── Serialización de respuesta ─────────────────────────────

type RawTask = {
  id: string
  titulo: string
  descripcion: string | null
  fecha_limite: Date | null
  prioridad_manual: string
  estado: string
  created_at: Date
  completed_at: Date | null
}

/** Convierte un registro Prisma Task al formato JSON de respuesta */
export function serializeTask(task: RawTask) {
  return {
    id: task.id,
    titulo: task.titulo,
    descripcion: task.descripcion,
    fecha_limite: task.fecha_limite?.toISOString().split('T')[0] ?? null,
    prioridad_manual: task.prioridad_manual,
    estado: task.estado,
    created_at: task.created_at.toISOString(),
    completed_at: task.completed_at?.toISOString() ?? null,
  }
}
