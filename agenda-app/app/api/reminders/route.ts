import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import {
  CreateReminderSchema,
  ReminderQuerySchema,
  ANTELACION_MS,
  serializeReminder,
} from '@/lib/schemas/reminder.schema'

const REMINDER_SELECT = {
  id: true,
  entidad_tipo: true,
  task_id: true,
  event_id: true,
  antelacion_tipo: true,
  fecha_hora_disparo: true,
  mensaje: true,
  origen: true,
  estado: true,
} as const

/**
 * GET /api/reminders
 * Lista todos los recordatorios.
 *
 * Query params (opcionales):
 *   estado        "activo" | "disparado" | "cancelado"
 *   fecha_desde   YYYY-MM-DD
 *   fecha_hasta   YYYY-MM-DD
 *
 * Respuesta: { recordatorios: Reminder[], total: number }
 */
export const GET = withAuth(async (req: NextRequest) => {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = ReminderQuerySchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetros inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { estado, fecha_desde, fecha_hasta } = parsed.data

  const recordatorios = await prisma.reminder.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(fecha_desde || fecha_hasta
        ? {
            fecha_hora_disparo: {
              ...(fecha_desde ? { gte: new Date(fecha_desde) } : {}),
              ...(fecha_hasta ? { lte: new Date(`${fecha_hasta}T23:59:59Z`) } : {}),
            },
          }
        : {}),
    },
    orderBy: { fecha_hora_disparo: 'asc' },
    select: REMINDER_SELECT,
  })

  return NextResponse.json({ recordatorios: recordatorios.map(serializeReminder), total: recordatorios.length })
})

/**
 * POST /api/reminders
 * Crea un recordatorio asociado a una tarea o evento.
 *
 * Si antelacion_tipo ≠ "personalizado" y no se provee fecha_hora_disparo,
 * se calcula automáticamente restando la antelación a la fecha/hora de la entidad.
 *
 * Restricciones:
 * - Una tarea solo puede tener 1 recordatorio activo (campo @unique task_id)
 * - task_id / event_id deben existir en DB
 *
 * Respuesta 201: { recordatorio: Reminder }
 */
export const POST = withAuth(async (req: NextRequest) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const parsed = CreateReminderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { task_id, event_id, antelacion_tipo, fecha_hora_disparo, mensaje } = parsed.data

  // Determinar entidad_tipo y calcular fecha_hora_disparo si no se pasó
  let entidad_tipo: string
  let disparo: Date

  if (task_id) {
    entidad_tipo = 'tarea'

    // Verificar que la tarea existe
    const task = await prisma.task.findUnique({
      where: { id: task_id },
      select: { id: true, fecha_limite: true },
    })
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada.', field: 'task_id' }, { status: 404 })
    }

    // Verificar unicidad: una tarea solo tiene 1 recordatorio activo
    const existing = await prisma.reminder.findUnique({
      where: { task_id },
      select: { id: true, estado: true },
    })
    if (existing && existing.estado === 'activo') {
      return NextResponse.json(
        { error: 'Esta tarea ya tiene un recordatorio activo.', recordatorio_id: existing.id },
        { status: 409 },
      )
    }

    // Calcular disparo
    if (fecha_hora_disparo) {
      disparo = new Date(fecha_hora_disparo)
    } else if (task.fecha_limite && antelacion_tipo !== 'personalizado') {
      // Fecha límite es medianoche UTC — se interpreta como inicio del día laboral 09:00
      const base = new Date(task.fecha_limite)
      base.setUTCHours(9, 0, 0, 0)
      disparo = new Date(base.getTime() - ANTELACION_MS[antelacion_tipo])
    } else {
      return NextResponse.json(
        {
          error:
            'La tarea no tiene fecha_limite. Provee fecha_hora_disparo explícita.',
          field: 'fecha_hora_disparo',
        },
        { status: 400 },
      )
    }
  } else if (event_id) {
    entidad_tipo = 'evento'

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: { id: true, fecha: true, hora_inicio: true },
    })
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado.', field: 'event_id' }, { status: 404 })
    }

    if (fecha_hora_disparo) {
      disparo = new Date(fecha_hora_disparo)
    } else if (antelacion_tipo !== 'personalizado') {
      // Base = fecha del evento + hora_inicio ("HH:MM")
      const [h, m] = event.hora_inicio.split(':').map(Number)
      const base = new Date(event.fecha)
      base.setUTCHours(h, m, 0, 0)
      disparo = new Date(base.getTime() - ANTELACION_MS[antelacion_tipo])
    } else {
      return NextResponse.json(
        { error: 'antelacion_tipo "personalizado" requiere fecha_hora_disparo.', field: 'fecha_hora_disparo' },
        { status: 400 },
      )
    }
  } else {
    return NextResponse.json(
      { error: 'Se requiere task_id o event_id.' },
      { status: 400 },
    )
  }

  const recordatorio = await prisma.reminder.create({
    data: {
      entidad_tipo,
      task_id: task_id ?? null,
      event_id: event_id ?? null,
      antelacion_tipo,
      fecha_hora_disparo: disparo,
      mensaje: mensaje ?? null,
    },
    select: REMINDER_SELECT,
  })

  return NextResponse.json({ recordatorio: serializeReminder(recordatorio) }, { status: 201 })
})
