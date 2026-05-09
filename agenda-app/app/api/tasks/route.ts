import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import {
  CreateTaskSchema,
  TaskQuerySchema,
  serializeTask,
} from '@/lib/schemas/task.schema'

/**
 * GET /api/tasks
 * Lista todas las tareas del ejecutivo.
 *
 * Query params (todos opcionales):
 *   estado              "pendiente" | "completada"
 *   fecha_limite_antes  YYYY-MM-DD — incluye tareas con deadline ≤ esta fecha
 *   fecha_limite_despues YYYY-MM-DD — incluye tareas con deadline ≥ esta fecha
 *
 * Respuesta: { tareas: Task[], total: number }
 */
export const GET = withAuth(async (req: NextRequest) => {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = TaskQuerySchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetros de consulta inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { estado, fecha_limite_antes, fecha_limite_despues } = parsed.data

  const tareas = await prisma.task.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(fecha_limite_antes || fecha_limite_despues
        ? {
            fecha_limite: {
              ...(fecha_limite_antes ? { lte: new Date(fecha_limite_antes) } : {}),
              ...(fecha_limite_despues ? { gte: new Date(fecha_limite_despues) } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ estado: 'asc' }, { fecha_limite: 'asc' }, { created_at: 'desc' }],
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      fecha_limite: true,
      prioridad_manual: true,
      estado: true,
      created_at: true,
      completed_at: true,
    },
  })

  return NextResponse.json({ tareas: tareas.map(serializeTask), total: tareas.length })
})

/**
 * POST /api/tasks
 * Crea una nueva tarea. Solo `titulo` es obligatorio.
 *
 * Body: { titulo, descripcion?, fecha_limite?, prioridad_manual?, estado? }
 * Respuesta 201: { tarea: Task }
 */
export const POST = withAuth(async (req: NextRequest) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const parsed = CreateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos.', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { titulo, descripcion, fecha_limite, prioridad_manual, estado } = parsed.data

  const tarea = await prisma.task.create({
    data: {
      titulo,
      descripcion: descripcion ?? null,
      fecha_limite: fecha_limite ? new Date(fecha_limite) : null,
      prioridad_manual,
      estado,
      completed_at: estado === 'completada' ? new Date() : null,
    },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      fecha_limite: true,
      prioridad_manual: true,
      estado: true,
      created_at: true,
      completed_at: true,
    },
  })

  return NextResponse.json({ tarea: serializeTask(tarea) }, { status: 201 })
})
