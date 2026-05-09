#!/usr/bin/env tsx
/**
 * verify-all.ts — F3-04: Orquestador de suite completa
 *
 * Ejecuta todos los scripts de verificación en orden y produce
 * un resumen ejecutivo con el resultado de cada suite.
 *
 * Uso:
 *   npm run verify:all
 *   npm run verify:all -- --skip-load   # salta prueba de carga
 *   npm run verify:all -- --only=auth,tasks  # solo suites específicas
 */

import { execSync } from 'child_process'
import { resolve } from 'path'

const SCRIPTS_DIR = resolve(__dirname)

// ── Definición de suites ─────────────────────────────────────────────────────

interface Suite {
  id: string
  name: string
  script: string
  critical: boolean // si falla, se puede continuar con las demás
}

const SUITES: Suite[] = [
  { id: 'auth',          name: 'Autenticación',               script: 'verify-auth.ts',              critical: true  },
  { id: 'tasks',         name: 'CRUD Tareas',                  script: 'verify-tasks.ts',             critical: true  },
  { id: 'events',        name: 'CRUD Eventos',                 script: 'verify-events.ts',            critical: true  },
  { id: 'reminders',     name: 'CRUD Recordatorios',           script: 'verify-reminders.ts',         critical: true  },
  { id: 'dashboard',     name: 'Dashboard',                    script: 'verify-dashboard.ts',         critical: false },
  { id: 'quickadd',      name: 'Quick Add',                    script: 'verify-quickadd.ts',          critical: false },
  { id: 'priorities',    name: 'Prioridades',                  script: 'verify-priorities.ts',        critical: false },
  { id: 'google-oauth',  name: 'Google OAuth',                 script: 'verify-google-oauth.ts',      critical: false },
  { id: 'calendar-sync', name: 'Google Calendar Sync',         script: 'verify-calendar-sync.ts',     critical: false },
  { id: 'conflicts',     name: 'Conflictos de Calendario',     script: 'verify-conflicts.ts',         critical: false },
  { id: 'integration',   name: 'Integración E2E',              script: 'verify-integration.ts',       critical: true  },
  { id: 'security',      name: 'Seguridad OWASP',              script: 'verify-security.ts',          critical: true  },
  { id: 'production',    name: 'Estabilidad Producción',        script: 'verify-production.ts',        critical: true  },
  { id: 'load',          name: 'Prueba de Carga',              script: 'verify-load.ts',              critical: false },
]

// ── Parseo de argumentos ─────────────────────────────────────────────────────

const args = process.argv.slice(2)
const skipLoad = args.includes('--skip-load')
const onlyArg = args.find((a) => a.startsWith('--only='))
const onlyIds = onlyArg ? onlyArg.replace('--only=', '').split(',') : null

function shouldRun(suite: Suite): boolean {
  if (suite.id === 'load' && skipLoad) return false
  if (onlyIds) return onlyIds.includes(suite.id)
  return true
}

// ── Resultado por suite ──────────────────────────────────────────────────────

interface SuiteResult {
  suite: Suite
  passed: boolean
  exitCode: number
  durationMs: number
  output: string
}

// ── Ejecutar suite ────────────────────────────────────────────────────────────

function runSuite(suite: Suite): SuiteResult {
  const scriptPath = resolve(SCRIPTS_DIR, suite.script)
  const t0 = Date.now()
  let output = ''
  let exitCode = 0

  try {
    output = execSync(`npx tsx "${scriptPath}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120_000, // 2 min por suite
      env: { ...process.env },
    })
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number }
    output = (e.stdout ?? '') + (e.stderr ?? '')
    exitCode = e.status ?? 1
  }

  return {
    suite,
    passed: exitCode === 0,
    exitCode,
    durationMs: Date.now() - t0,
    output,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now()

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║         AGENDA EJECUTIVA — SUITE COMPLETA DE TESTS         ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(`  Servidor esperado: http://localhost:${process.env.PORT ?? 3000}`)
  console.log(`  Fecha: ${new Date().toLocaleString('es')}`)
  if (skipLoad) console.log('  ⚡ Modo rápido: prueba de carga omitida')
  if (onlyIds)  console.log(`  🎯 Suites seleccionadas: ${onlyIds.join(', ')}`)
  console.log()

  const suitesToRun = SUITES.filter(shouldRun)
  const results: SuiteResult[] = []

  for (let i = 0; i < suitesToRun.length; i++) {
    const suite = suitesToRun[i]
    const prefix = `[${i + 1}/${suitesToRun.length}]`
    process.stdout.write(`${prefix} ${suite.name}... `)

    const result = runSuite(suite)
    results.push(result)

    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} (${result.durationMs}ms)`)

    // Si falla una suite crítica, mostrar output
    if (!result.passed) {
      const lines = result.output.trim().split('\n')
      // Mostrar las últimas 15 líneas
      const tail = lines.slice(-15)
      console.log('    ┌─ Output (últimas líneas) ──────────────────────────────')
      for (const line of tail) {
        console.log(`    │ ${line}`)
      }
      console.log('    └────────────────────────────────────────────────────────')
    }
  }

  // ── Resumen final ─────────────────────────────────────────────────────────
  const totalMs = Date.now() - startTime
  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length
  const skippedCount = SUITES.length - suitesToRun.length

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║                      RESUMEN FINAL                        ║')
  console.log('╠════════════════════════════════════════════════════════════╣')

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌'
    const name = r.suite.name.padEnd(32)
    const dur  = `${r.durationMs}ms`.padStart(7)
    const crit = r.suite.critical ? ' ⚠' : '  '
    console.log(`║ ${icon} ${name}${dur}${crit}  ║`)
  }

  if (skippedCount > 0) {
    const skippedNames = SUITES.filter((s) => !shouldRun(s)).map((s) => s.name)
    console.log('╠════════════════════════════════════════════════════════════╣')
    for (const name of skippedNames) {
      console.log(`║ ⏭  ${name.padEnd(44)}  ║`)
    }
  }

  console.log('╠════════════════════════════════════════════════════════════╣')
  const globalIcon = failedCount === 0 ? '✅' : '❌'
  const summary = `Total: ${results.length}  ✅ ${passedCount}  ❌ ${failedCount}  ⏭ ${skippedCount}  (${(totalMs / 1000).toFixed(1)}s)`
  console.log(`║ ${globalIcon} ${summary.padEnd(56)} ║`)
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  // Salir con error si alguna suite crítica falló
  const criticalFailed = results.some((r) => !r.passed && r.suite.critical)
  if (criticalFailed) {
    console.error('❌ Una o más suites CRÍTICAS fallaron.')
    process.exit(1)
  }

  if (failedCount > 0) {
    console.warn(`⚠️  ${failedCount} suite(s) no crítica(s) fallaron. El MVP funciona pero hay issues.`)
    process.exit(2)
  }

  console.log('✅ Todas las suites pasaron correctamente.\n')
}

main().catch((err) => {
  console.error('Error fatal en verify:all:', err)
  process.exit(1)
})
