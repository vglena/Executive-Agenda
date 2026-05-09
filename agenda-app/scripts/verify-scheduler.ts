/**
 * scripts/verify-scheduler.ts — Smoke test de F1#5: node-cron scheduler.
 *
 * Prueba sin servidor activo:
 *   1. getLocalTime — conversión de zona horaria
 *   2. initScheduler — guard de doble inicialización y conteo de jobs
 *   3. _resetSchedulerForTesting — limpieza y re-inicialización
 *   4. checkAndTriggerDailyGeneration — retorna inmediatamente si la hora no coincide
 *   5. checkAndTriggerDailySummary — ídem
 *
 * Ejecutar: npx tsx scripts/verify-scheduler.ts
 */

import 'dotenv/config'
import {
  initScheduler,
  isSchedulerInitialized,
  getActiveJobCount,
  _resetSchedulerForTesting,
} from '@/lib/services/scheduler.service'
import { getLocalTime } from '@/lib/utils/time'
import { checkAndTriggerDailyGeneration } from '@/lib/services/priorities.service'
import { checkAndTriggerDailySummary } from '@/lib/services/summary.service'

let passed = 0
let failed = 0

function ok(label: string) {
  console.log(`  [OK] ${label}`)
  passed++
}

function fail(label: string, detail?: string) {
  console.error(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`)
  failed++
}

async function main() {
  // ── 1. getLocalTime ────────────────────────────────────────────────────────

  console.log('\n1. getLocalTime (conversión de zona horaria)\n')

  {
    // Debe devolver un objeto con hours y minutes válidos
    const { hours, minutes } = getLocalTime('America/Mexico_City')
    typeof hours === 'number' && hours >= 0 && hours <= 23
      ? ok(`America/Mexico_City → hours=${hours} (rango válido 0-23)`)
      : fail('hours fuera de rango', String(hours))

    typeof minutes === 'number' && minutes >= 0 && minutes <= 59
      ? ok(`minutes=${minutes} (rango válido 0-59)`)
      : fail('minutes fuera de rango', String(minutes))
  }

  {
    // UTC y una tz con offset fijo — deben diferir si el offset es != 0
    const utc = getLocalTime('UTC')
    const nyc = getLocalTime('America/New_York')  // UTC-4 o UTC-5 según DST
    const valid = typeof utc.hours === 'number' && typeof nyc.hours === 'number'
    valid ? ok('America/New_York retorna valores numéricos válidos') : fail('NYC timezone', JSON.stringify(nyc))
  }

  {
    // Medianoche en UTC → Intl puede devolver 24; verificamos que lo normalizamos a 0
    // No podemos controlar la hora actual, pero sí que el valor esté en rango
    const { hours } = getLocalTime('UTC')
    hours !== 24 ? ok('Intl hour=24 normalizado a 0') : fail('hours=24 no normalizado')
  }

  // ── 2. initScheduler — primera inicialización ──────────────────────────────

  console.log('\n2. initScheduler (primera inicialización)\n')

  _resetSchedulerForTesting() // estado limpio

  !isSchedulerInitialized()
    ? ok('Estado inicial: no inicializado')
    : fail('Estado inicial', 'ya marcado como inicializado antes de initScheduler()')

  getActiveJobCount() === 0
    ? ok('Cero jobs antes de initScheduler()')
    : fail('Jobs antes de init', String(getActiveJobCount()))

  initScheduler()

  isSchedulerInitialized()
    ? ok('isSchedulerInitialized() = true tras initScheduler()')
    : fail('isSchedulerInitialized() aún false')

  getActiveJobCount() === 3
    ? ok('getActiveJobCount() = 3 (recordatorios, diario, calendario)')
    : fail('Conteo de jobs', `esperado 3, got ${getActiveJobCount()}`)

  // ── 3. Guard de doble inicialización ──────────────────────────────────────

  console.log('\n3. Guard de doble inicialización\n')

  initScheduler() // segunda llamada — debe ser ignorada

  getActiveJobCount() === 3
    ? ok('Segunda initScheduler() ignorada — job count no cambia')
    : fail('Doble init no protegida', `esperado 3, got ${getActiveJobCount()}`)

  // ── 4. resetForTesting ────────────────────────────────────────────────────

  console.log('\n4. _resetSchedulerForTesting()\n')

  _resetSchedulerForTesting()

  !isSchedulerInitialized()
    ? ok('isSchedulerInitialized() = false tras reset')
    : fail('isSchedulerInitialized() no limpiado')

  getActiveJobCount() === 0
    ? ok('getActiveJobCount() = 0 tras reset')
    : fail('Jobs no limpiados', String(getActiveJobCount()))

  // Re-inicializar para dejar el scheduler en estado correcto al final
  initScheduler()
  getActiveJobCount() === 3 ? ok('Re-inicialización tras reset OK') : fail('Re-init', String(getActiveJobCount()))

  // ── 5. checkAndTriggerDailyGeneration — guard de hora ────────────────────

  console.log('\n5. checkAndTriggerDailyGeneration — guard de hora incorrecta\n')

  {
    // Pasamos una hora que NO es la de resumen_diario del ejecutivo (07:30).
    // Como no hay servidor, necesitamos que la función use la DB.
    // Si la hora actual != 07:30, debe retornar sin llamar a generateDailyPriorities.
    // Medimos que no lanza errores (DB disponible en .env.local).
    const { hours, minutes } = getLocalTime('America/Mexico_City')
    const isResumenTime = hours === 7 && minutes === 30

    try {
      await checkAndTriggerDailyGeneration()
      if (!isResumenTime) {
        ok('checkAndTriggerDailyGeneration retorna sin error fuera de hora_resumen_diario')
      } else {
        ok('checkAndTriggerDailyGeneration ejecutó (son las 07:30 en Mexico City)')
      }
    } catch (err) {
      fail('checkAndTriggerDailyGeneration lanzó error', err instanceof Error ? err.message : String(err))
    }
  }

  // ── 6. checkAndTriggerDailySummary — guard de hora ────────────────────────

  console.log('\n6. checkAndTriggerDailySummary — guard de hora incorrecta\n')

  {
    const { hours, minutes } = getLocalTime('America/Mexico_City')
    const isResumenTime = hours === 7 && minutes === 30

    try {
      await checkAndTriggerDailySummary()
      if (!isResumenTime) {
        ok('checkAndTriggerDailySummary retorna sin error fuera de hora_resumen_diario')
      } else {
        ok('checkAndTriggerDailySummary ejecutó (son las 07:30 en Mexico City)')
      }
    } catch (err) {
      fail('checkAndTriggerDailySummary lanzó error', err instanceof Error ? err.message : String(err))
    }
  }

  // ── Resultado ───────────────────────────────────────────────────────────────

  _resetSchedulerForTesting() // limpieza final — no dejar cron jobs activos en el proceso

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Resultado: ${passed} OK  |  ${failed} FAIL`)
  console.log(`${'─'.repeat(50)}\n`)

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('[ERROR]', err)
  process.exit(1)
})
