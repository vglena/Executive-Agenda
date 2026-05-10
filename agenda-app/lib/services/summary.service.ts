import { prisma } from '@/lib/db'
import { getLLMAdapter } from '@/lib/ai'
import { getLocalTime } from '@/lib/utils/time'
import { sanitizeLLMText } from '@/lib/security/sanitize'
import type { SummaryContext } from '@/lib/ai/types'

/**
 * Genera el resumen diario del ejecutivo.
 * Compila datos del día (eventos, tareas, vencidos) y llama al LLM.
 */
export async function generateDailySummary(): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.dailySummary.findUnique({ where: { fecha: today } })
  if (existing) return

  const todayStr = today.toISOString().split('T')[0]

  // Recopilar datos del día
  const eventos = await prisma.event.findMany({
    where: { fecha: today, estado: 'activo' },
    orderBy: { hora_inicio: 'asc' },
  })

  const tareasPrioritarias = await prisma.dailyPriority.findUnique({
    where: { fecha: today },
  })

  const tareasVencidas = await prisma.task.findMany({
    where: {
      estado: 'pendiente',
      fecha_limite: { lt: today },
    },
  })

  const context: SummaryContext = {
    fecha: todayStr,
    eventos: eventos.map((e) => ({
      titulo: e.titulo,
      hora_inicio: e.hora_inicio,
      hora_fin: e.hora_fin,
    })),
    tareas_prioritarias: (tareasPrioritarias?.tareas_rankeadas ?? []).slice(0, 3).map((id) => ({
      titulo: id, // se reemplaza abajo
      fecha_limite: null,
      prioridad_manual: 'P3',
    })),
    tareas_vencidas: tareasVencidas.map((t) => ({
      titulo: t.titulo,
      fecha_limite: t.fecha_limite?.toISOString().split('T')[0] ?? '',
    })),
  }

  // Obtener títulos de tareas prioritarias
  if (tareasPrioritarias && tareasPrioritarias.tareas_rankeadas.length > 0) {
    const topTasks = await prisma.task.findMany({
      where: { id: { in: tareasPrioritarias.tareas_rankeadas.slice(0, 3) } },
    })
    context.tareas_prioritarias = topTasks.map((t) => ({
      titulo: t.titulo,
      fecha_limite: t.fecha_limite?.toISOString().split('T')[0] ?? null,
      prioridad_manual: t.prioridad_manual,
    }))
  }

  // Llamar al LLM (o fallback local si no hay API key)
  const llm = getLLMAdapter()
  let contenido = ''
  let sugerencia = ''

  try {
    ;[contenido, sugerencia] = await Promise.all([
      llm.generateDailySummary(context),
      llm.generateDaySuggestion(context),
    ])
  } catch (err) {
    console.error('[summary] Error generando resumen:', err)
    contenido = 'Resumen no disponible — error al contactar el servicio de IA.'
    sugerencia = ''
  }

  // Sanitizar output del LLM antes de persistir en DB
  contenido = sanitizeLLMText(contenido)
  sugerencia = sanitizeLLMText(sugerencia)

  await prisma.dailySummary.create({
    data: {
      fecha: today,
      contenido_completo: contenido,
      eventos_del_dia: eventos.map((e) => e.id),
      tareas_vencidas: tareasVencidas.map((t) => t.id),
      tareas_prioritarias: tareasPrioritarias?.tareas_rankeadas.slice(0, 3) ?? [],
      sugerencia_del_dia: sugerencia,
    },
  })

  console.log('[summary] Resumen diario generado')
}

/**
 * Verifica si corresponde generar el resumen del día y lo genera si no existe.
 * Llamado desde el scheduler cada minuto.
 * Se ejecuta en la hora configurada en hora_resumen_diario del ejecutivo.
 * Las prioridades deben estar generadas antes (checkAndTriggerDailyGeneration corre primero).
 */
export async function checkAndTriggerDailySummary(): Promise<void> {
  const executive = await prisma.executive.findFirst()
  if (!executive) return

  const [horaConfig, minConfig] = executive.hora_resumen_diario.split(':').map(Number)

  const { hours, minutes } = getLocalTime(executive.zona_horaria)
  if (hours !== horaConfig || minutes !== minConfig) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.dailySummary.findUnique({ where: { fecha: today } })
  if (existing) return

  await generateDailySummary()
}
