import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { prisma } from '../lib/db'

async function main() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const del1 = await prisma.dailySummary.deleteMany({ where: { fecha: today } })
  const del2 = await prisma.dailyPriority.deleteMany({ where: { fecha: today } })
  console.log(`Resumen del día borrado: ${del1.count} registro(s)`)
  console.log(`Prioridades del día borradas: ${del2.count} registro(s)`)
  console.log('El próximo GET /api/daily-summary regenerará el resumen automáticamente.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
