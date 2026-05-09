import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import type { Executive } from '@prisma/client'

/**
 * getCurrentExecutive — extrae y valida el token del request,
 * luego devuelve el único ejecutivo del sistema.
 *
 * Retorna null si el token es inválido o no existe el ejecutivo.
 * Uso típico dentro de un handler protegido por withAuth.
 */
export async function getCurrentExecutive(req: NextRequest): Promise<Executive | null> {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token) return null

  try {
    await verifyToken(token)
  } catch {
    return null
  }

  return prisma.executive.findFirst()
}

/**
 * requireExecutive — igual que getCurrentExecutive pero retorna
 * una respuesta 401 si no se puede autenticar.
 * Usar cuando el handler necesita el ejecutivo para operar.
 */
export async function requireExecutive(
  req: NextRequest
): Promise<{ executive: Executive; error: null } | { executive: null; error: NextResponse }> {
  const executive = await getCurrentExecutive(req)
  if (!executive) {
    return {
      executive: null,
      error: NextResponse.json({ error: 'No autorizado.' }, { status: 401 }),
    }
  }
  return { executive, error: null }
}
