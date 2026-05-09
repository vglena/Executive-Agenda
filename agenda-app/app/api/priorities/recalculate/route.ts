import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { generateDailyPriorities } from '@/lib/services/priorities.service'

/**
 * POST /api/priorities/recalculate
 * Fuerza el recálculo de las prioridades del día.
 * Borra el registro existente y regenera desde cero.
 */
export const POST = withAuth(async (_req: NextRequest) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Borrar registro existente para forzar regeneración
  await prisma.dailyPriority.deleteMany({ where: { fecha: today } })

  await generateDailyPriorities()

  const priority = await prisma.dailyPriority.findUnique({ where: { fecha: today } })

  return NextResponse.json({
    ok: true,
    recalculado_en: priority?.generated_at ?? new Date(),
    tareas_count: Array.isArray(priority?.tareas_rankeadas) ? priority.tareas_rankeadas.length : 0,
  })
})
