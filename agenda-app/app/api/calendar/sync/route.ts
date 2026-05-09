/**
 * POST /api/calendar/sync
 *
 * Dispara manualmente la sincronización Google Calendar → DB.
 * Requiere JWT válido.
 *
 * Response 200:
 *   { ok: true, sincronizado_en, creados, actualizados, cancelados, sin_cambios, conflictos_detectados }
 *
 * Response 409: Google Calendar no conectado
 * Response 502: Error al llamar a Google
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { syncGoogleCalendarToDB } from '@/lib/services/calendar.service'
import { calendarSyncRateLimiter } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req: NextRequest): Promise<NextResponse> => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rl = calendarSyncRateLimiter.check(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas sincronizaciones. Intenta de nuevo en unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  let result
  try {
    result = await syncGoogleCalendarToDB(true)
  } catch (err) {
    console.error('[POST /api/calendar/sync] Error:', err)
    return NextResponse.json(
      { ok: false, error: 'Error al sincronizar con Google Calendar.' },
      { status: 502 }
    )
  }

  if (result.error?.includes('no conectado') || result.error?.includes('no configurado')) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true, ...result })
})
