/**
 * GET /api/auth/google
 *
 * Inicia el flujo OAuth 2.0 con Google Calendar.
 * Requiere JWT válido (el ejecutivo debe estar autenticado en la app).
 * Devuelve JSON con la URL de autorización — el cliente redirige con window.location.href.
 *
 * Response 200: { url: string }
 * Response 503: Google no configurado
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { buildAuthUrl, isGoogleConfigured } from '@/lib/integrations/calendar/google-oauth'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_req: NextRequest): Promise<NextResponse> => {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      {
        error: 'Google Calendar no configurado.',
        detail: 'Agrega GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI al entorno.',
      },
      { status: 503 }
    )
  }

  const { url } = await buildAuthUrl()

  // Devuelve la URL — el cliente hace window.location.href = url
  return NextResponse.json({ url })
})
