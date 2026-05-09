import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { UpdateTaskSchema, serializeTask } from '@/lib/schemas/task.schema'

const TASK_SELECT = {
  id: true,
  titulo: true,
  descripcion: true,
  fecha_limite: true,
  prioridad_manual: true,
  estado: true,
  created_at: true,
  completed_at: true,
} as const

/** Extrae el ID de la URL: /api/tasks/[id] → id */
function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').pop() ?? ''
}

/**
 * GET /api/tasks/[id]
 * Devuelve una tarea por ID.
 * Respuesta 200: { tarea: Task }
 * Respuesta 404: si no existe
 */
export const GET = withAuth(async (req: NextRequest) => {
  const id = extractId(req)

  const tarea = await prisma.task.findUnique({ where: { id }, select: TASK_SELECT })

  if (!tarea) {
    return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ tarea: serializeTask(tarea) })
})

/**
 * PUT /api/tasks/[id]
 * Actualiza campos de una tarea. Todos los campos son opcionales.
 * Al pasar estado="completada" se registra completed_at automáticamente.
 * Al pasar estado="pendiente" se limpia completed_at.
 *
 * Body: { titulo?, descripcion?, fecha_limite?, prioridad_manual?, estado? }
 * Respuesta 200: { tarea: Task }
 */
export const PUT = withAuth(async (req: NextRequest) => {
  const id = extractId(req)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const parsed = UpdateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  // Verificar que existe
  const exists = await prisma.task.findUnique({ where: { id }, select: { id: true, estado: true } })
  if (!exists) {
    return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 })
  }

  const { titulo, descripcion, fecha_limite, prioridad_manual, estado } = parsed.data

  // Calcular completed_at según transición de estado
  let completed_at: Date | null | undefined = undefined
  if (estado === 'completada' && exists.estado !== 'completada') {
    completed_at = new Date()
  } else if (estado === 'pendiente') {
    completed_at = null
  }

  const tarea = await prisma.task.update({
    where: { id },
    data: {
      ...(titulo !== undefined ? { titulo } : {}),
      ...(descripcion !== undefined ? { descripcion } : {}),
      ...(fecha_limite !== undefined ? { fecha_limite: fecha_limite ? new Date(fecha_limite) : null } : {}),
      ...(prioridad_manual !== undefined ? { prioridad_manual } : {}),
      ...(estado !== undefined ? { estado } : {}),
      ...(completed_at !== undefined ? { completed_at } : {}),
    },
    select: TASK_SELECT,
  })

  return NextResponse.json({ tarea: serializeTask(tarea) })
})

/**
 * DELETE /api/tasks/[id]
 * Elimina una tarea y su recordatorio asociado (cascade en DB).
 * Respuesta 204: sin cuerpo
 * Respuesta 404: si no existe
 */
export const DELETE = withAuth(async (req: NextRequest) => {
  const id = extractId(req)

  const exists = await prisma.task.findUnique({ where: { id }, select: { id: true } })
  if (!exists) {
    return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 })
  }

  await prisma.task.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
})
