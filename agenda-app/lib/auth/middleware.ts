import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/auth/jwt'

/**
 * withAuth — wrapper que protege un API Route handler.
 *
 * Uso:
 *   export const GET = withAuth(async (req) => {
 *     return NextResponse.json({ ok: true })
 *   })
 *
 * Si el token es inválido o está ausente retorna 401 automáticamente.
 */
export function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const token = extractBearerToken(req.headers.get('authorization'))

    if (!token) {
      return NextResponse.json({ error: 'No autorizado. Token requerido.' }, { status: 401 })
    }

    try {
      await verifyToken(token)
    } catch {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 })
    }

    return handler(req)
  }
}
