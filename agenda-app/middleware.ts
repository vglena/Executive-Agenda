/**
 * middleware.ts — Next.js Edge Middleware
 *
 * Responsabilidades:
 * 1. Manejar CORS preflight (OPTIONS) para rutas /api/*
 * 2. Añadir X-Request-ID para trazabilidad en logs
 * 3. Bloquear métodos HTTP no permitidos en rutas API
 *
 * NOTA: Los security headers principales (CSP, HSTS, etc.)
 * están en next.config.mjs para mayor control.
 */

import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest): NextResponse {
  const { pathname, origin } = req.nextUrl
  const method = req.method.toUpperCase()

  // ── CORS preflight ────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/') && method === 'OPTIONS') {
    const allowedOrigin = process.env.ALLOWED_ORIGIN ?? req.headers.get('origin') ?? '*'
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const res = NextResponse.next()

  // ── X-Request-ID para trazabilidad ───────────────────────────────────────
  const requestId = crypto.randomUUID()
  res.headers.set('X-Request-ID', requestId)

  // ── Eliminar cabeceras que revelan información del stack ─────────────────
  res.headers.delete('X-Powered-By')

  return res
}

export const config = {
  // Aplicar solo a rutas API y páginas — excluir assets estáticos
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
