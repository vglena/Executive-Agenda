/**
 * GET /api/calendar/conflicts
 *
 * Devuelve conflictos de calendario detectados entre eventos de Google y manuales.
 *
 * Query params:
 *   ?incluir_resueltos=true  — incluye conflictos revisados/ignorados
 *
 * Response 200:
 *   {
 *     conflictos: ConflictoDetalle[],
 *     total: number,
 *     pendientes: number
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getConflicts, getPendingConflictCount } from '@/lib/services/conflict.service'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url)
  const incluirResueltos = searchParams.get('incluir_resueltos') === 'true'

  const [conflictos, pendientes] = await Promise.all([
    getConflicts(incluirResueltos),
    getPendingConflictCount(),
  ])

  return NextResponse.json({
    conflictos,
    total: conflictos.length,
    pendientes,
  })
})
