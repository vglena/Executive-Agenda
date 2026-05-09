import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { generateDailySummary } from '@/lib/services/summary.service'

/**
 * GET /api/daily-summary
 * Devuelve el resumen diario del día actual.
 * Si aún no existe, lo genera on-demand.
 *
 * Respuesta 200:
 * {
 *   fecha: "YYYY-MM-DD",
 *   contenido_completo: string,
 *   sugerencia_del_dia: string,
 *   eventos_del_dia: string[],   // IDs de Event
 *   tareas_vencidas: string[],   // IDs de Task
 *   tareas_prioritarias: string[], // IDs de Task (top 3)
 *   estado: string,
 *   generated_at: ISO string
 * }
 */
export const GET = withAuth(async (_req: NextRequest) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let summary = await prisma.dailySummary.findUnique({ where: { fecha: today } })

  if (!summary) {
    await generateDailySummary()
    summary = await prisma.dailySummary.findUnique({ where: { fecha: today } })
  }

  if (!summary) {
    return NextResponse.json(
      { error: 'No se pudo generar el resumen diario.' },
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
