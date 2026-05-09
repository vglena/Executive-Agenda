/**
 * GET /api/auth/google/callback
 *
 * Callback OAuth 2.0 de Google.
 * Google redirige aquí con ?code=xxx&state=yyy tras la autorización del usuario.
 *
 * Flujo:
 *  1. Verifica el state (JWT firmado, expira en 10 min) — previene CSRF
 *  2. Intercambia el código por access_token + refresh_token
 *  3. Encripta y guarda los tokens en Executive.google_calendar_token
 *  4. Redirige al dashboard con ?google=connected
 *
 * No requiere Authorization header — este endpoint es llamado por el browser como redirect de Google.
 */

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, verifyOAuthState } from '@/lib/integrations/calendar/google-oauth'
import { GoogleCalendarAdapter } from '@/lib/integrations/calendar/google.adapter'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // El usuario rechazó el acceso en Google
  if (error) {
    console.warn('[google/callback] El usuario rechazó el acceso:', error)
    return NextResponse.redirect(new URL('/dashboard?google=denied', req.url))
  }

  // Parámetros requeridos
  if (!code || !state) {
    return NextResponse.json({ error: 'Parámetros de callback inválidos.' }, { status: 400 })
  }

  // 1. Verificar state — previene CSRF
  try {
    await verifyOAuthState(state)
  } catch (err) {
    console.error('[google/callback] State inválido:', err)
    return NextResponse.json(
      { error: 'State de OAuth inválido o expirado. Inicia el flujo nuevamente.' },
      { status: 400 }
    )
  }

  // 2. Intercambiar código por tokens
  let tokens
  try {
    tokens = await exchangeCodeForTokens(code)
  } catch (err) {
    console.error('[google/callback] Error al intercambiar código:', err)
    return NextResponse.json(
      { error: 'No se pudo obtener los tokens de Google. Intenta de nuevo.' },
      { status: 502 }
    )
  }

  // 3. Guardar tokens encriptados en DB
  try {
    const adapter = new GoogleCalendarAdapter()
    await adapter.saveTokens(tokens)
  } catch (err) {
    console.error('[google/callback] Error al guardar tokens:', err)
    return NextResponse.json(
      { error: 'No se pudo guardar la conexión con Google Calendar.' },
      { status: 500 }
    )
  }

  // 4. Redirigir al dashboard con indicador de éxito
  const dashboardUrl = new URL('/dashboard', req.url)
  dashboardUrl.searchParams.set('google', 'connected')
  return NextResponse.redirect(dashboardUrl)
}
