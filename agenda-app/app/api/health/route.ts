/**
 * GET /api/health
 *
 * Healthcheck endpoint para Railway y monitores externos.
 * Checks: DB, scheduler, variables de entorno requeridas.
 *
 * Response 200: sistema operativo (db OK + env vars OK)
 * Response 503: algún check crítico falla
 *
 * No requiere autenticación — endpoint de liveness/readiness.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isSchedulerInitialized, getActiveJobCount } from '@/lib/services/scheduler.service'

export const dynamic = 'force-dynamic'

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'EXECUTIVE_EMAIL',
  'EXECUTIVE_PASSWORD_HASH',
]

const OPTIONAL_ENV_VARS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'GOOGLE_TOKEN_ENCRYPTION_KEY',
  'OPENAI_API_KEY',
]

export async function GET() {
  const startedAt = Date.now()

  // ── 1. Variables de entorno ───────────────────────────────────────────────
  const missingRequired = REQUIRED_ENV_VARS.filter((v) => !process.env[v])
  const missingOptional = OPTIONAL_ENV_VARS.filter((v) => !process.env[v])
  const envStatus = missingRequired.length === 0 ? 'ok' : 'error'

  // ── 2. Base de datos ──────────────────────────────────────────────────────
  let dbStatus: 'ok' | 'error' = 'ok'
  let dbMs: number | null = null
  try {
    const t0 = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbMs = Date.now() - t0
  } catch {
    dbStatus = 'error'
  }

  // ── 3. Scheduler ─────────────────────────────────────────────────────────
  const schedulerStatus = isSchedulerInitialized() ? 'ok' : 'not_started'
  const activeJobs = getActiveJobCount()

  // ── Estado global ─────────────────────────────────────────────────────────
  const critical = dbStatus === 'ok' && envStatus === 'ok'
  const status = critical ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - startedAt,
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV ?? 'development',
      checks: {
        database: { status: dbStatus, latency_ms: dbMs },
        scheduler: { status: schedulerStatus, active_jobs: activeJobs },
        env_vars: {
          status: envStatus,
          missing_required: missingRequired,
          missing_optional: missingOptional,
        },
      },
    },
    { status: critical ? 200 : 503 }
  )
}

