import { prisma } from '@/lib/db'

/**
 * Verifica recordatorios cuya hora de disparo ya pasó y los marca como disparados.
 * Llamado cada minuto por el scheduler.
 */
export async function checkAndFireReminders(): Promise<void> {
  const now = new Date()

  const pending = await prisma.reminder.findMany({
    where: {
      estado: 'activo',
      fecha_hora_disparo: { lte: now },
    },
  })

  if (pending.length === 0) return

  await prisma.reminder.updateMany({
    where: { id: { in: pending.map((r) => r.id) } },
    data: { estado: 'disparado' },
  })

  console.log(`[reminders] ${pending.length} recordatorio(s) disparado(s)`)
}
