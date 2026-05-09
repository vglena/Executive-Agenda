import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { UpdateEventSchema, serializeEvent } from '@/lib/schemas/event.schema'
import { detectConflict } from '@/lib/utils/event-conflict'

const EVENT_SELECT = {
  id: true,
  titulo: true,
  fecha: true,
  hora_inicio: true,
  hora_fin: true,
  descripcion: true,
  ubicacion: true,
  origen: true,
  id_externo: true,
  sincronizado: true,
  conflicto_detectado: true,
  estado: true,
  created_at: true,
} as const

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').pop() ?? ''
}

/**
 * GET /api/events/[id]
 * Devuelve un evento por ID.
 */
export const GET = withAuth(async (req: NextRequest) => {
  const id = extractId(req)
  const evento = await prisma.event.findUnique({ where: { id }, select: EVENT_SELECT })

  if (!evento) {
    return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ evento: serializeEvent(evento) })
})

/**
 * PUT /api/events/[id]
 * Actualiza campos de un evento. Todos opcionales.
 * Recalcula conflicto_detectado si cambia fecha/hora.
 *
 * Body: { titulo?, fecha?, hora_inicio?, hora_fin?, descripcion?, ubicacion?, estado? }
 */
export const PUT = withAuth(async (req: NextRequest) => {
  const id = extractId(req)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const parsed = UpdateEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const current = await prisma.event.findUnique({
    where: { id },
    select: { id: true, fecha: true, hora_inicio: true, hora_fin: true },
  })
  if (!current) {
    return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 })
  }

  const { titulo, fecha, hora_inicio, hora_fin, descripcion, ubicacion, estado } = parsed.data

  // Recalcular conflicto si cambia fecha u hora
  const nuevaFecha = fecha ? new Date(fecha) : current.fecha
  const nuevaInicio = hora_inicio ?? current.hora_inicio
  const nuevaFin = hora_fin ?? current.hora_fin
  const horasCambiaron = fecha !== undefined || hora_inicio !== undefined || hora_fin !== undefined
  const conflicto_detectado = horasCambiaron
    ? await detectConflict(nuevaFecha, nuevaInicio, nuevaFin, id)
    : undefined

  const evento = await prisma.event.update({
    where: { id },
    data: {
      ...(titulo !== undefined ? { titulo } : {}),
      ...(fecha !== undefined ? { fecha: new Date(fecha) } : {}),
      ...(hora_inicio !== undefined ? { hora_inicio } : {}),
      ...(hora_fin !== undefined ? { hora_fin } : {}),
      ...(descripcion !== undefined ? { descripcion } : {}),
      ...(ubicacion !== undefined ? { ubicacion } : {}),
      ...(estado !== undefined ? { estado } : {}),
      ...(conflicto_detectado !== undefined ? { conflicto_detectado } : {}),
    },
    select: EVENT_SELECT,
  })

  return NextResponse.json({ evento: serializeEvent(evento) })
})

/**
 * DELETE /api/events/[id]
 * Elimina un evento y sus recordatorios (cascade en DB).
 * Respuesta 204: sin cuerpo.
 */
export const DELETE = withAuth(async (req: NextRequest) => {
  const id = extractId(req)

  const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } })
  if (!exists) {
    return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 })
  }

  await prisma.event.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
})
