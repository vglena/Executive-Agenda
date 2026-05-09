import { prisma } from '@/lib/db'
import { getLLMAdapter } from '@/lib/ai'
import { getLocalTime } from '@/lib/utils/time'

// La app sugiere foco operativo automáticamente. La prioridad manual existe por
// compatibilidad con datos actuales, pero es una señal secundaria.

function getWeights() {
  return {
    deadline: parseFloat(process.env.PRIORITY_WEIGHT_DEADLINE ?? '0.62'),
    manual: parseFloat(process.env.PRIORITY_WEIGHT_MANUAL ?? '0.08'),
    load: parseFloat(process.env.PRIORITY_WEIGHT_LOAD ?? '0.12'),
    conflicts: parseFloat(process.env.PRIORITY_WEIGHT_CONFLICTS ?? '0.1'),
    reminders: parseFloat(process.env.PRIORITY_WEIGHT_REMINDERS ?? '0.08'),
  }
}

function diasHastaDeadline(deadline: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = deadline.getTime() - today.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function calcularScore(
  task: {
    fecha_limite: Date | null
    prioridad_manual: string
    reminder?: { fecha_hora_disparo: Date; estado: string } | null
  },
  eventCount: number,
  signals: { pendingConflicts?: number; now?: Date } = {}
): number {
  const w = getWeights()
  const now = signals.now ?? new Date()

  const dias = task.fecha_limite !== null ? diasHastaDeadline(task.fecha_limite) : null
  const deadlineSignal =
    dias === null ? 1 :
    dias < 0 ? 10 :
    dias === 0 ? 9 :
    dias === 1 ? 7 :
    dias <= 3 ? 5 :
    dias <= 7 ? 3 :
    1

  const manualMap: Record<string, number> = { P1: 2, P2: 1.2, P3: 0.4, P4: 0 }
  const manualSignal = manualMap[task.prioridad_manual] ?? 0.4

  const loadSignal = eventCount >= 5 ? 3 : eventCount >= 3 ? 2 : eventCount >= 1 ? 1 : 0
  const conflictSignal = Math.min(signals.pendingConflicts ?? 0, 3)

  const reminder = task.reminder
  const reminderHours = reminder && reminder.estado === 'activo'
    ? (reminder.fecha_hora_disparo.getTime() - now.getTime()) / (1000 * 60 * 60)
    : null
  const reminderSignal =
    reminderHours === null ? 0 :
    reminderHours < 0 ? 2 :
    reminderHours <= 2 ? 4 :
    reminderHours <= 24 ? 2.5 :
    0.5

  const lateDayBoost = now.getHours() >= 15 && dias !== null && dias <= 0 ? 1 : 0

  return (
    deadlineSignal * w.deadline +
    manualSignal * w.manual +
    loadSignal * w.load +
    conflictSignal * w.conflicts +
    reminderSignal * w.reminders +
    lateDayBoost
  )
}

/**
 * Verifica si corresponde generar el foco del dia y lo genera si no existe.
 * Llamado cada minuto por el scheduler.
 */
export async function checkAndTriggerDailyGeneration(): Promise<void> {
  const executive = await prisma.executive.findFirst()
  if (!executive) return

  const [horaConfig, minConfig] = executive.hora_resumen_diario.split(':').map(Number)

  const { hours, minutes } = getLocalTime(executive.zona_horaria)
  if (hours !== horaConfig || minutes !== minConfig) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.dailyPriority.findUnique({ where: { fecha: today } })
  if (existing) return

  await generateDailyPriorities()
}

/**
 * Genera el foco operativo del dia.
 * Maximo 5 tareas. Score determinista (sin LLM).
 * Las justificaciones se generan con LLM en el mismo paso.
 */
export async function generateDailyPriorities(): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventCount = await prisma.event.count({
    where: {
      fecha: today,
      estado: 'activo',
    },
  })

  const pendingConflicts = await prisma.conflict.count({
    where: { estado: 'pendiente' },
  })

  const tasks = await prisma.task.findMany({
    where: { estado: 'pendiente' },
    include: {
      reminder: {
        select: { fecha_hora_disparo: true, estado: true },
      },
    },
  })

  if (tasks.length === 0) {
    await prisma.dailyPriority.upsert({
      where: { fecha: today },
      update: { tareas_rankeadas: [], scores: {}, justificaciones: {}, generated_at: new Date() },
      create: {
        fecha: today,
        tareas_rankeadas: [],
        scores: {},
        justificaciones: {},
        tareas_rechazadas_hoy: [],
      },
    })
    return
  }

  const scored = tasks
    .map((t) => ({
      ...t,
      score: calcularScore(
        {
          fecha_limite: t.fecha_limite,
          prioridad_manual: t.prioridad_manual,
          reminder: t.reminder,
        },
        eventCount,
        { pendingConflicts }
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const scoresMap: Record<string, number> = {}
  scored.forEach((t) => { scoresMap[t.id] = t.score })

  const llm = getLLMAdapter()
  let justificaciones: Record<string, string> = {}
  try {
    justificaciones = await llm.generateJustifications(scored)
  } catch (err) {
    console.error('[priorities] Error generando justificaciones:', err)
    scored.forEach((t) => { justificaciones[t.id] = '' })
  }

  await prisma.dailyPriority.upsert({
    where: { fecha: today },
    update: {
      tareas_rankeadas: scored.map((t) => t.id),
      scores: scoresMap,
      justificaciones,
      recalculated_at: new Date(),
    },
    create: {
      fecha: today,
      tareas_rankeadas: scored.map((t) => t.id),
      scores: scoresMap,
      justificaciones,
      tareas_rechazadas_hoy: [],
    },
  })

  console.log(`[priorities] Foco generado con ${scored.length} tarea(s)`)
}
