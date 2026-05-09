import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL no configurada')

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const executive = await prisma.executive.findFirst()
  if (!executive) {
    console.error('[ERROR] No se encontró ningún ejecutivo en la base de datos.')
    process.exit(1)
  }
  console.log('[OK] Prisma Client funciona correctamente.')
  console.log('[OK] Ejecutivo encontrado:')
  console.log(`     id:                     ${executive.id}`)
  console.log(`     nombre:                 ${executive.nombre}`)
  console.log(`     zona_horaria:           ${executive.zona_horaria}`)
  console.log(`     horario_laboral:        ${executive.horario_laboral_inicio} – ${executive.horario_laboral_fin}`)
  console.log(`     hora_resumen_diario:    ${executive.hora_resumen_diario}`)
  console.log(`     dias_laborables:        ${executive.dias_laborables.join(', ')}`)
  console.log(`     google_calendar_token:  ${executive.google_calendar_token ?? 'null (no conectado)'}`)
}

main()
  .catch((err) => {
    console.error('[ERROR]', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
