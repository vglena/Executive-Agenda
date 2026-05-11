'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { Task } from '@/lib/types/api'

function todayISO(): string { return new Date().toISOString().split('T')[0] }
function addDays(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
function deadlineLabel(fl: string | null): string {
  if (!fl) return ''
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const [y, m, d] = fl.split('-').map(Number)
  const t = new Date(y, m - 1, d)
  const diff = Math.round((t.getTime() - now.getTime()) / 86400000)
  if (diff < -1) return `Venci\u00f3 hace ${-diff} d\u00edas`
  if (diff === -1) return 'Venci\u00f3 ayer'
  if (diff === 0) return 'Vence hoy'
  if (diff === 1) return 'Ma\u00f1ana'
  if (diff <= 6) {
    const day = t.toLocaleDateString('es', { weekday: 'long' })
    return day.charAt(0).toUpperCase() + day.slice(1)
  }
  return t.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function EmptySectionState({ message, cta, onCta }: { message: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-200 px-4 py-4 text-center">
      <p className="text-sm text-stone-400">{message}</p>
      {cta && onCta && (
        <button onClick={onCta} className="mt-2.5 rounded-xl bg-stone-100 px-3.5 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-200">
          {cta}
        </button>
      )}
    </div>
  )
}

function TaskRow({ task, onTap }: { task: Task; onTap?: (t: Task) => void }) {
  const deadline = deadlineLabel(task.fecha_limite)
  const isOverdue = !!(task.fecha_limite && task.fecha_limite < todayISO())
  const isDemo = task.id.startsWith('__')
  return (
    <button
      onClick={() => !isDemo && onTap?.(task)}
      className="flex w-full items-center gap-3 rounded-xl bg-stone-50 px-3 py-2.5 text-left transition active:bg-stone-100"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-stone-800">
          {task.titulo}{isDemo && <span className="ml-1.5 text-[10px] font-medium text-stone-300">demo</span>}
        </p>
        {deadline && <p className={`mt-0.5 text-xs ${isOverdue ? 'text-rose-500' : 'text-stone-400'}`}>{deadline}</p>}
      </div>
      {task.prioridad_manual === 'P1' && (
        <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Urgente</span>
      )}
      {!isDemo && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-300" aria-hidden>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  )
}

export function VistaEjecutivaSemana({
  refreshKey = 0,
  onTaskTap,
  onCrear,
}: {
  refreshKey?: number
  onTaskTap?: (task: Task) => void
  onCrear?: () => void
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isDemo = process.env.NODE_ENV === 'development' || window.location.search.includes('demo')
    setLoading(true)
    apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente')
      .then((d) => {
        const real = d.tareas
        if (isDemo && real.length === 0) {
          const today = todayISO()
          const yst = addDays(-1)
          const in3s = addDays(3)
          const in5s = addDays(5)
          setTasks([
            { id: '__t1', titulo: 'Preparar propuesta Q3', descripcion: null, fecha_limite: yst, prioridad_manual: 'P1', estado: 'pendiente', created_at: '', completed_at: null },
            { id: '__t2', titulo: 'Revisar contrato proveedor', descripcion: null, fecha_limite: today, prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
            { id: '__t3', titulo: 'Actualizar presentaci\u00f3n inversores', descripcion: null, fecha_limite: in3s, prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
            { id: '__t4', titulo: 'Definir roadmap siguiente trimestre', descripcion: null, fecha_limite: in5s, prioridad_manual: 'P1', estado: 'pendiente', created_at: '', completed_at: null },
          ])
        } else {
          setTasks(real)
        }
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return null

  const today = todayISO()
  const nextWeek = addDays(7)

  // Deliverables: tasks with deadline within 7 days (including overdue) OR no deadline but high priority
  const deliverables = tasks.filter((t) => {
    if (t.fecha_limite) return t.fecha_limite <= nextWeek
    return t.prioridad_manual === 'P1' || t.prioridad_manual === 'P2'
  })

  // Decisions: P1 tasks with no near deadline (not already in deliverables via deadline filter)
  const decisions = tasks.filter(
    (t) => t.prioridad_manual === 'P1' && !t.fecha_limite,
  )

  const hasDeliverables = deliverables.length > 0
  const hasDecisions = decisions.length > 0

  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-950">Esta semana</h2>
          {onCrear && (
            <button onClick={onCrear} className="text-xs text-stone-400 transition hover:text-stone-700">
              + Agregar
            </button>
          )}
        </div>

        {!hasDeliverables && !hasDecisions && (
          <EmptySectionState
            message="Sin entregas ni decisiones registradas."
            cta="+ Crear pendiente"
            onCta={onCrear}
          />
        )}

        {hasDeliverables && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">Entregas cercanas</p>
            <div className="space-y-1.5">
              {deliverables.slice(0, 6).map((t) => (
                <TaskRow key={t.id} task={t} onTap={onTaskTap} />
              ))}
            </div>
          </div>
        )}

        {hasDecisions && (
          <div className={hasDeliverables ? 'mt-5' : ''}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">Decisiones en espera</p>
            <div className="space-y-1.5">
              {decisions.map((t) => (
                <TaskRow key={t.id} task={t} onTap={onTaskTap} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
