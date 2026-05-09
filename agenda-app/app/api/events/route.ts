import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { CreateEventSchema, EventQuerySchema, serializeEvent } from '@/lib/schemas/event.schema'
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

/**
 * GET /api/events
 * Lista eventos. Query params opcionales:
 *   fecha            YYYY-MM-DD — eventos de un día exacto
 *   fecha_desde      YYYY-MM-DD — rango inicio (inclusivo)
 *   fecha_hasta      YYYY-MM-DD — rango fin (inclusivo)
 *   estado           "activo" | "cancelado"
 *
 * Respuesta: { eventos: Event[], total: number }
 */
export const GET = withAuth(async (req: NextRequest) => {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = EventQuerySchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetros de consulta inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { fecha, fecha_desde, fecha_hasta, estado } = parsed.data

  const eventos = await prisma.event.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(fecha
        ? { fecha: new Date(fecha) }
        : fecha_desde || fecha_hasta
          ? {
              fecha: {
                ...(fecha_desde ? { gte: new Date(fecha_desde) } : {}),
                ...(fecha_hasta ? { lte: new Date(fecha_hasta) } : {}),
              },
            }
          : {}),
    },
    orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
    select: EVENT_SELECT,
  })

  return NextResponse.json({ eventos: eventos.map(serializeEvent), total: eventos.length })
})

/**
 * POST /api/events
 * Crea un nuevo evento manual.
 * Campos obligatorios: titulo, fecha, hora_inicio, hora_fin
 * Detección automática de conflicto de horario.
 *
 * Respuesta 201: { evento: Event }
 * Respuesta 400: validación fallida
 * Respuesta 409: evento con mismo id_externo ya existe
 */
export const POST = withAuth(async (req: NextRequest) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const parsed = CreateEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { titulo, fecha, hora_inicio, hora_fin, descripcion, ubicacion, id_externo } = parsed.data

  // id_externo único: evitar duplicados de GCal
  if (id_externo) {
    const existing = await prisma.event.findUnique({ where: { id_externo }, select: { id: true } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un evento con ese id_externo.', id: existing.id },
        { status: 409 },
      )
    }
  }

  const fechaDate = new Date(fecha)
  const conflicto_detectado = await detectConflict(fechaDate, hora_inicio, hora_fin)

  const evento = await prisma.event.create({
    data: {
      titulo,
      fecha: fechaDate,
      hora_inicio,
      hora_fin,
      descripcion: descripcion ?? null,
      ubicacion: ubicacion ?? null,
      id_externo: id_externo ?? null,
      origen: id_externo ? 'google_calendar' : 'manual',
      conflicto_detectado,
    },
    select: EVENT_SELECT,
  })

  return NextResponse.json({ evento: serializeEvent(evento) }, { status: 201 })
})
