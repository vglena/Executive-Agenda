/**
 * cleanup-test-data.ts
 * Elimina datos de prueba dejados en la DB por los scripts de verificación.
 * Uso: npx tsx scripts/cleanup-test-data.ts
 */

import 'dotenv/config'
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
import { prisma } from '../lib/db'

const TEST_PATTERNS = [
  /^\[VAL\]/i,
  /^\[LOAD TEST\]/i,
  /^alert\(/i,
]

function isTestData(text: string): boolean {
  return TEST_PATTERNS.some((p) => p.test(text))
}

async function main() {
  console.log('=== Limpieza de datos de test ===\n')

  // Tareas
  const tareas = await prisma.task.findMany({ select: { id: true, titulo: true } })
  const tareasTest = tareas.filter((t) => isTestData(t.titulo))
  console.log(`Tareas encontradas: ${tareas.length} total, ${tareasTest.length} de test`)

  for (const t of tareasTest) {
    await prisma.task.delete({ where: { id: t.id } })
    console.log(`  ❌ Tarea eliminada: [${t.id}] "${t.titulo}"`)
  }

  // Eventos
  const eventos = await prisma.event.findMany({ select: { id: true, titulo: true } })
  const eventosTest = eventos.filter((e) => isTestData(e.titulo))
  console.log(`\nEventos encontrados: ${eventos.length} total, ${eventosTest.length} de test`)

  for (const e of eventosTest) {
    await prisma.event.delete({ where: { id: e.id } })
    console.log(`  ❌ Evento eliminado: [${e.id}] "${e.titulo}"`)
  }

  // Recordatorios huérfanos (tarea_id o evento_id apunta a algo ya eliminado)
  const recordatorios = await prisma.reminder.findMany({
    select: { id: true, mensaje: true },
  })
  const recsTest = recordatorios.filter((r) => r.mensaje && isTestData(r.mensaje))
  console.log(`\nRecordatorios encontrados: ${recordatorios.length} total, ${recsTest.length} de test`)

  for (const r of recsTest) {
    await prisma.reminder.delete({ where: { id: r.id } })
    console.log(`  ❌ Recordatorio eliminado: [${r.id}] "${r.mensaje}"`)
  }

  console.log('\n=== Limpieza completada ===')

  // Resumen final
  const tareasFinales = await prisma.task.count()
  const eventosFinales = await prisma.event.count()
  const recsFinales = await prisma.reminder.count()
  console.log(`\nEstado final: ${tareasFinales} tarea(s), ${eventosFinales} evento(s), ${recsFinales} recordatorio(s)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
