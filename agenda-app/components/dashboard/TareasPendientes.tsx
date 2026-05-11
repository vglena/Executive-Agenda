'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Task } from '@/lib/types/api'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

type TSlot = 'overdue' | 'today' | 'later'

function getTaskSlot(fechaLimite: string | null): TSlot {
  if (!fechaLimite) return 'later'
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const [y, m, d] = fechaLimite.split('-').map(Number)
  const t = new Date(y, m - 1, d)
  const diff = Math.round((t.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  return 'later'
}

function deadlineLabel(fl: string | null): string {
  if (!fl) return ''
  const now = new Date()
  now.setHours(0, 0, 0, 0)
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

function TaskItem({ task, onRemove, onTap }: { task: Task; onRemove: (id: string) => void; onTap: (task: Task) => void }) {
  const [completing, setCompleting] = useState(false)
  const slot = getTaskSlot(task.fecha_limite)
  const deadline = deadlineLabel(task.fecha_limite)
  const isDemo = task.id.startsWith('__')

  const bgColor = slot === 'overdue' ? 'bg-rose-50/60' : slot === 'today' ? 'bg-blue-50/50' : 'bg-stone-50/50'
  const circleColor = slot === 'overdue' ? 'border-rose-300 hover:border-rose-500' : slot === 'today' ? 'border-blue-300 hover:border-blue-500' : 'border-stone-300 hover:border-stone-400'
  const deadlineColor = slot === 'overdue' ? 'text-rose-500' : slot === 'today' ? 'text-blue-500' : 'text-stone-400'

  async function handleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    setCompleting(true)
    onRemove(task.id)
    if (isDemo) return
    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ estado: 'completada' }) })
    } catch { /* optimistic */ }
  }

  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-2xl ${bgColor} px-3 py-3 transition-opacity ${completing ? 'opacity-0' : 'opacity-100'} cursor-pointer active:scale-[0.99]`}
      onClick={() => !isDemo && onTap(task)}
    >
      <button onClick={handleComplete} disabled={completing} aria-label="Marcar completada" className="shrink-0">
        <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${completing ? 'border-stone-200 bg-stone-100' : circleColor}`} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] leading-snug ${slot === 'today' ? 'font-medium text-stone-900' : slot === 'overdue' ? 'text-stone-700' : 'text-stone-600'}`}>
          {task.titulo}{isDemo && <span className="ml-1.5 text-[10px] font-medium text-stone-300">demo</span>}
        </p>
        {deadline && <p className={`mt-0.5 text-xs ${deadlineColor}`}>{deadline}</p>}
      </div>
      {task.prioridad_manual === 'P1' && (
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Urgente</span>
      )}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-300" aria-hidden>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  )
}

export function TareasPendientes({ refreshKey = 0, onTaskTap, onCrear }: { refreshKey?: number; onTaskTap?: (task: Task) => void; onCrear?: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showLater, setShowLater] = useState(false)

  useEffect(() => {
    const isDemo = process.env.NODE_ENV === 'development' || window.location.search.includes('demo')
    setLoading(true)
    apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente')
      .then((d) => {
        const real = d.tareas
        if (isDemo && real.length === 0) {
          const today = todayISO()
          const y1 = new Date(); y1.setDate(y1.getDate() - 1)
          const yst = y1.toISOString().split('T')[0]
          const in3 = new Date(); in3.setDate(in3.getDate() + 3)
          const in3s = in3.toISOString().split('T')[0]
          setTasks([
            { id: '__t1', titulo: 'Preparar propuesta Q3', descripcion: null, fecha_limite: yst, prioridad_manual: 'P1', estado: 'pendiente', created_at: '', completed_at: null },
            { id: '__t2', titulo: 'Revisar contrato proveedor', descripcion: null, fecha_limite: today, prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
            { id: '__t3', titulo: 'Actualizar presentaci\u00f3n inversores', descripcion: null, fecha_limite: in3s, prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
            { id: '__t4', titulo: 'Definir roadmap siguiente trimestre', descripcion: null, fecha_limite: null, prioridad_manual: 'P1', estado: 'pendiente', created_at: '', completed_at: null },
          ])
        } else {
          setTasks(real)
        }
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [refreshKey])

  function handleRemove(id: string) { setTasks((t) => t.filter((x) => x.id !== id)) }
  if (loading) return null

  const urgent = tasks.filter((t) => { const s = getTaskSlot(t.fecha_limite); return s === 'overdue' || s === 'today' })
  const later = tasks.filter((t) => getTaskSlot(t.fecha_limite) === 'later')
  const handleTap = onTaskTap ?? (() => {})

  if (tasks.length === 0) {
    return (
      <section className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-stone-950">Pendientes</h2>
        <div className="rounded-xl border border-dashed border-stone-200 px-4 py-5 text-center">
          <p className="text-sm text-stone-400">Sin tareas pendientes</p>
          <p className="mt-0.5 text-xs text-stone-300">Todo al día — excelente</p>
          {onCrear && (
            <button onClick={onCrear} className="mt-3 rounded-xl bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-200">
              + Crear tarea
            </button>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-stone-950">Pendientes</h2>
      {urgent.length > 0 ? (
        <div className="space-y-1.5">
          {urgent.map((t) => <TaskItem key={t.id} task={t} onRemove={handleRemove} onTap={handleTap} />)}
        </div>
      ) : (
        <p className="text-sm text-stone-400">Sin urgentes para hoy.</p>
      )}
      {later.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setShowLater((v) => !v)} className="flex items-center gap-1.5 text-xs text-stone-400 transition hover:text-stone-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showLater ? 'rotate-180' : ''}`} aria-hidden>
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {showLater ? 'Ocultar' : `${later.length} m\u00e1s para despu\u00e9s`}
          </button>
          {showLater && (
            <div className="mt-2 space-y-1.5">
              {later.map((t) => <TaskItem key={t.id} task={t} onRemove={handleRemove} onTap={handleTap} />)}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
