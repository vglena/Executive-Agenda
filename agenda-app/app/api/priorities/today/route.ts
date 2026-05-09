import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { generateDailyPriorities } from '@/lib/services/priorities.service'

/**
 * GET /api/priorities/today
 * Devuelve el ranking de prioridades del día.
 * Si aún no se generó (hora_resumen_diario no llegó), lo genera on-demand.
 *
 * Respuesta:
 * {
 *   fecha: "YYYY-MM-DD",
 *   generado_en: ISO string,
 *   recalculado_en: ISO string | null,
 *   tareas: [{ id, titulo, prioridad_manual, fecha_limite, score, justificacion }]
 * }
 */
export const GET = withAuth(async (_req: NextRequest) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let priority = await prisma.dailyPriority.findUnique({ where: { fecha: today } })

  // Generar on-demand si todavía no existe para hoy
  if (!priority) {
    await generateDailyPriorities()
    priority = await prisma.dailyPriority.findUnique({ where: { fecha: today } })
  }

  if (!priority || priority.tareas_rankeadas.length === 0) {
    return NextResponse.json({
      fecha: today.toISOString().split('T')[0],
      generado_en: priority?.generated_at ?? null,
      recalculado_en: null,
      tareas: [],
      mensaje: 'Sin tareas pendientes para hoy.',
    })
  }

  // Cargar detalles completos de las tareas rankeadas
  const tasks = await prisma.task.findMany({
    where: { id: { in: priority.tareas_rankeadas } },
    select: { id: true, titulo: true, prioridad_manual: true, fecha_limite: true },
  })

  const tasksById = Object.fromEntries(tasks.map((t) => [t.id, t]))
  const scores = priority.scores as Record<string, number>
  const justificaciones = priority.justificaciones as Record<string, string>

  // Preservar el orden del ranking (tareas_rankeadas ya está ordenado por score)
  const tareas = priority.tareas_rankeadas
    .filter((id) => tasksById[id]) // omitir tareas eliminadas
    .map((id, posicion) => ({
      posicion: posicion + 1,
      id,
      titulo: tasksById[id].titulo,
      prioridad_manual: tasksById[id].prioridad_manual,
      fecha_limite: tasksById[id].fecha_limite?.toISOString().split('T')[0] ?? null,
      score: Math.round((scores[id] ?? 0) * 100) / 100,
      justificacion: justificaciones[id] ?? '',
    }))

  return NextResponse.json({
    fecha: today.toISOString().split('T')[0],
    generado_en: priority.generated_at,
    recalculado_en: priority.recalculated_at ?? null,
    tareas,
  })
})
