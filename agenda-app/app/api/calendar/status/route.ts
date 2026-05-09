/**
 * GET /api/calendar/status
 *
 * Devuelve el estado de conexión con Google Calendar.
 * Requiere JWT válido.
 *
 * Response 200:
 *   { connected: boolean, configured: boolean, message: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { isGoogleConfigured } from '@/lib/integrations/calendar/google-oauth'
import { GoogleCalendarAdapter } from '@/lib/integrations/calendar/google.adapter'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_req: NextRequest): Promise<NextResponse> => {
  const configured = isGoogleConfigured()

  if (!configured) {
    return NextResponse.json({
      connected: false,
      configured: false,
      message: 'Google Calendar no está configurado en el servidor.',
    })
  }

  const adapter = new GoogleCalendarAdapter()
  const connected = await adapter.isConnected()

  return NextResponse.json({
    connected,
    configured: true,
    message: connected
      ? 'Google Calendar conectado.'
      : 'Google Calendar configurado pero no conectado. Usa GET /api/auth/google para autorizar.',
  })
})
