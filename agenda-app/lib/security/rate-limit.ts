/**
 * rate-limit.ts — Rate limiter in-memory para MVP.
 *
 * Sin Redis ni dependencias externas.
 * Apropiado para servidor single-instance (Railway, dev).
 *
 * Uso:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 5 })
 *   const result = limiter.check(ip)
 *   if (!result.allowed) return NextResponse.json(..., { status: 429 })
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  /** Ventana de tiempo en ms */
  windowMs: number
  /** Máximo de requests permitidas en la ventana */
  max: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max } = options
  const store = new Map<string, RateLimitEntry>()

  // Limpia entradas expiradas cada windowMs para evitar memory leak
  const cleanup = setInterval(() => {
    const now = Date.now()
    const keys = Array.from(store.keys())
    for (const key of keys) {
      const entry = store.get(key)
      if (entry && entry.resetAt <= now) store.delete(key)
    }
  }, windowMs)

  // En entornos serverless/test evitar que el intervalo bloquee el proceso
  if (cleanup.unref) cleanup.unref()

  function check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
    }

    if (entry.count >= max) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
  }

  return { check }
}

// ── Instancias globales ────────────────────────────────────────────────────────

/** Login: 10 intentos por IP cada 15 minutos */
export const loginRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 })

/** Sync Google Calendar: 5 syncs por IP cada 10 minutos */
export const calendarSyncRateLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 })

/** API general: 200 requests por IP cada minuto (protección básica DDoS) */
export const apiRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 200 })
