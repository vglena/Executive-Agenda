/**
 * prisma/seed.ts — Crea el único ejecutivo del sistema.
 *
 * Uso:
 *   1. Asegúrate de que .env tiene EXECUTIVE_EMAIL y EXECUTIVE_PASSWORD_HASH.
 *   2. Para generar el hash de la contraseña:
 *        node -e "const b=require('bcryptjs');b.hash('TuContraseña',12).then(console.log)"
 *   3. Ejecutar el seed:
 *        npx prisma db seed
 *
 * Este script es idempotente: si ya existe un ejecutivo, no lo duplica.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL no está configurada en .env')

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const existing = await prisma.executive.findFirst()
  if (existing) {
    console.log('[seed] Ejecutivo ya existe — omitiendo creación.')
    return
  }

  const executive = await prisma.executive.create({
    data: {
      nombre: 'Ejecutivo',
      zona_horaria: 'America/Mexico_City',
      horario_laboral_inicio: '08:00',
      horario_laboral_fin: '19:00',
      dias_laborables: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      hora_resumen_diario: '07:30',
    },
  })

  console.log(`[seed] Ejecutivo creado: ${executive.id}`)
  console.log('[seed] Configura EXECUTIVE_EMAIL y EXECUTIVE_PASSWORD_HASH en .env')
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
