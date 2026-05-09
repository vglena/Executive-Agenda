import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { UpdateReminderSchema, serializeReminder } from '@/lib/schemas/reminder.schema'

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

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').pop() ?? ''
}

/**
 * GET /api/reminders/[id]
 * Devuelve un recordatorio por ID.
 */
export const GET = withAuth(async (req: NextRequest) => {
  const id = extractId(req)
  const recordatorio = await prisma.reminder.findUnique({ where: { id }, select: REMINDER_SELECT })

  if (!recordatorio) {
    return NextResponse.json({ error: 'Recordatorio no encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ recordatorio: serializeReminder(recordatorio) })
})

/**
 * PUT /api/reminders/[id]
 * Actualiza fecha/hora de disparo, mensaje o estado de un recordatorio.
 *
 * Transiciones de estado permitidas:
 *   activo → cancelado   (usuario cancela)
 *   activo → disparado   (marcar como disparado manualmente — normalmente lo hace el scheduler)
 *   cancelado → activo   (reactivar)
 *
 * Un recordatorio "disparado" no puede volver a activo.
 *
 * Body: { fecha_hora_disparo?, mensaje?, estado? }
 */
export const PUT = withAuth(async (req: NextRequest) => {
  const id = extractId(req)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const parsed = UpdateReminderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const current = await prisma.reminder.findUnique({
    where: { id },
    select: { id: true, estado: true },
  })
  if (!current) {
    return NextResponse.json({ error: 'Recordatorio no encontrado.' }, { status: 404 })
  }

  const { fecha_hora_disparo, mensaje, estado } = parsed.data

  // Bloquear reactivación desde estado "disparado"
  if (estado === 'activo' && current.estado === 'disparado') {
    return NextResponse.json(
      { error: 'Un recordatorio disparado no puede volver a activo.' },
      { status: 409 },
    )
  }

  const recordatorio = await prisma.reminder.update({
    where: { id },
    data: {
      ...(fecha_hora_disparo !== undefined ? { fecha_hora_disparo: new Date(fecha_hora_disparo) } : {}),
      ...(mensaje !== undefined ? { mensaje } : {}),
      ...(estado !== undefined ? { estado } : {}),
    },
    select: REMINDER_SELECT,
  })

  return NextResponse.json({ recordatorio: serializeReminder(recordatorio) })
})

/**
 * DELETE /api/reminders/[id]
 * Elimina un recordatorio.
 * Respuesta 204: sin cuerpo.
 */
export const DELETE = withAuth(async (req: NextRequest) => {
  const id = extractId(req)

  const exists = await prisma.reminder.findUnique({ where: { id }, select: { id: true } })
  if (!exists) {
    return NextResponse.json({ error: 'Recordatorio no encontrado.' }, { status: 404 })
  }

  await prisma.reminder.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
})
