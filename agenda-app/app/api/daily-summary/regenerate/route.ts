import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { generateDailySummary } from '@/lib/services/summary.service'

/**
 * POST /api/daily-summary/regenerate
 * Fuerza la regeneración del resumen diario.
 * Borra el existente y lo recrea vía LLM/fallback.
 */
export const POST = withAuth(async (_req: NextRequest) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Borrar para que generateDailySummary no haga early-return
  await prisma.dailySummary.deleteMany({ where: { fecha: today } })

  await generateDailySummary()

  const summary = await prisma.dailySummary.findUnique({ where: { fecha: today } })

  if (!summary) {
    return NextResponse.json(
      { error: 'No se pudo regenerar el resumen diario.' },
      { status: 503 },
    )
  }

  return NextResponse.json({
    fecha: summary.fecha.toISOString().split('T')[0],
    contenido_completo: summary.contenido_completo,
    sugerencia_del_dia: summary.sugerencia_del_dia,
    eventos_del_dia: summary.eventos_del_dia,
    tareas_vencidas: summary.tareas_vencidas,
    tareas_prioritarias: summary.tareas_prioritarias,
    estado: summary.estado,
    generated_at: summary.generated_at.toISOString(),
  })
})
