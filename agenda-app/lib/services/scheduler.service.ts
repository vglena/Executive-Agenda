import cron from 'node-cron'

// ── Estado del scheduler ──────────────────────────────────────────────────────

type ScheduledTask = ReturnType<typeof cron.schedule>

const state = {
  initialized: false,
  tasks: [] as ScheduledTask[],
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Inicializa todos los jobs de cron. Seguro para llamar múltiples veces —
 * una segunda llamada es ignorada (prevención de doble inicialización).
 *
 * Jobs registrados:
 *   - Recordatorios: cada minuto
 *   - Priorización diaria: cada minuto (dispara en hora_resumen_diario del ejecutivo)
 *   - Resumen diario: cada minuto (dispara en hora_resumen_diario, tras priorización)
 *   - Sincronización de calendario: cada 15 minutos (no-op si no hay token)
 */
export function initScheduler(): void {
  if (state.initialized) {
    console.warn('[scheduler] Ya inicializado — llamada ignorada.')
    return
  }
  state.initialized = true

  log('Iniciando jobs de cron...')

  // ── Job 1: Verificar recordatorios pendientes ────────────────────────────
  state.tasks.push(
    cron.schedule('* * * * *', async () => {
      try {
        const { checkAndFireReminders } = await import('./reminders.service')
        await checkAndFireReminders()
      } catch (err) {
        logError('recordatorios', err)
      }
    })
  )

  // ── Job 2: Priorización diaria + resumen diario ───────────────────────────
  // Ambos en el mismo job para garantizar orden: prioridades → resumen
  state.tasks.push(
    cron.schedule('* * * * *', async () => {
      // Paso 1: Prioridades (deben existir antes de generar el resumen)
      try {
        const { checkAndTriggerDailyGeneration } = await import('./priorities.service')
        await checkAndTriggerDailyGeneration()
      } catch (err) {
        logError('priorización diaria', err)
      }

      // Paso 2: Resumen (usa las prioridades generadas en el paso anterior)
      try {
        const { checkAndTriggerDailySummary } = await import('./summary.service')
        await checkAndTriggerDailySummary()
      } catch (err) {
        logError('resumen diario', err)
      }
    })
  )

  // ── Job 3: Sincronización de calendario externo ──────────────────────────
  state.tasks.push(
    cron.schedule('*/15 * * * *', async () => {
      try {
        const { syncCalendar } = await import('./calendar.service')
        await syncCalendar()
      } catch (err) {
        logError('sincronización calendario', err)
      }
    })
  )

  log(`${state.tasks.length} jobs activos: recordatorios (1min), prioridades+resumen (1min), calendario (15min)`)
}

/**
 * Detiene todos los jobs y resetea el estado.
 * Solo para uso en tests — no llamar en producción.
 */
export function _resetSchedulerForTesting(): void {
  state.tasks.forEach((t) => t.stop())
  state.tasks.length = 0
  state.initialized = false
}

/** Devuelve si el scheduler está activo. */
export function isSchedulerInitialized(): boolean {
  return state.initialized
}

/** Devuelve el número de jobs activos. */
export function getActiveJobCount(): number {
  return state.tasks.length
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[scheduler] ${msg}`)
}

function logError(jobName: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[scheduler] Error en job "${jobName}": ${message}`)
}

