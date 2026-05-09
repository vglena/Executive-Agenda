import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ── Inicialización lazy ──────────────────────────────────────────────────────
// PrismaClient NO se inicializa al importar el módulo.
// Esto permite que Next.js importe este módulo durante `next build`
// sin que DATABASE_URL deba estar disponible en el entorno de build.
// La conexión real se crea en la primera consulta.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL no está configurada.')
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Proxy lazy: delega todas las propiedades al cliente real en la primera llamada.
// TypeScript ve `prisma` como PrismaClient completo — tipado correcto.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
}) as unknown as PrismaClient

