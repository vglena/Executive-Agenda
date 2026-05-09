/**
 * POST /api/calendar/disconnect
 *
 * Desconecta Google Calendar: revoca el token en Google y limpia la DB.
 * Requiere JWT válido.
 *
 * Response 200:
 *   { ok: true, message: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { GoogleCalendarAdapter } from '@/lib/integrations/calendar/google.adapter'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (_req: NextRequest): Promise<NextResponse> => {
  const adapter = new GoogleCalendarAdapter()
  const wasConnected = await adapter.isConnected()

  if (!wasConnected) {
    return NextResponse.json(
      { ok: false, message: 'Google Calendar no estaba conectado.' },
      { status: 409 }
    )
  }

  await adapter.disconnect()

  return NextResponse.json({
    ok: true,
    message: 'Google Calendar desconectado correctamente. Los tokens han sido eliminados.',
  })
})
