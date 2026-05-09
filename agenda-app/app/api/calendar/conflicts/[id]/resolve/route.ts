/**
 * POST /api/calendar/conflicts/[id]/resolve
 *
 * Resuelve un conflicto de calendario.
 * Solo el usuario puede resolver — no hay resolución automática.
 *
 * Body: { estado: "revisado" | "ignorado", nota?: string }
 *
 * Response 200: { ok: true, conflicto: ConflictoDetalle }
 * Response 400: body inválido
 * Response 404: conflicto no encontrado
 * Response 409: conflicto ya resuelto
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { resolveConflict } from '@/lib/services/conflict.service'

export const dynamic = 'force-dynamic'

export const POST = withAuth(
  async (req: NextRequest): Promise<NextResponse> => {
    // Extraer [id] del path: /api/calendar/conflicts/{id}/resolve
    const segments = req.nextUrl.pathname.split('/')
    const id = segments[segments.indexOf('conflicts') + 1]

    if (!id) {
      return NextResponse.json({ error: 'ID de conflicto requerido' }, { status: 400 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
    }

    const { estado, nota } = body as { estado?: string; nota?: string }

    if (estado !== 'revisado' && estado !== 'ignorado') {
      return NextResponse.json(
        { error: 'estado debe ser "revisado" o "ignorado"' },
        { status: 400 },
      )
    }

    if (nota !== undefined && typeof nota !== 'string') {
      return NextResponse.json({ error: 'nota debe ser string' }, { status: 400 })
    }

    try {
      const conflicto = await resolveConflict(id, estado, nota)
      return NextResponse.json({ ok: true, conflicto })
    } catch (err) {
      const e = err as Error & { code?: string }
      if (e.code === 'NOT_FOUND') {
        return NextResponse.json({ error: 'Conflicto no encontrado' }, { status: 404 })
      }
      if (e.code === 'ALREADY_RESOLVED') {
        return NextResponse.json({ error: 'Este conflicto ya fue resuelto.' }, { status: 409 })
      }
      console.error('[POST /api/calendar/conflicts/[id]/resolve]', err)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
  },
)
