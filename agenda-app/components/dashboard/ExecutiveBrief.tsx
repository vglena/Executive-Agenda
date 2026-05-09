'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch, getToken } from '@/lib/api/client'
import type { AgendaEvent, DailySummary, PriorityTask, Task } from '@/lib/types/api'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatRelativeDate, formatTaskDeadline } from '@/lib/utils/display-time'

interface PrioritiesResponse {
  tareas: PriorityTask[]
  mensaje?: string
}

interface ConflictResponse {
  conflictos: unknown[]
}

interface ExecutiveBriefProps {
  refreshKey?: number
  googleConnected?: boolean
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function formatToday(): string {
  const raw = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const lowered = raw.toLowerCase()
  return lowered.charAt(0).toUpperCase() + lowered.slice(1)
}

function firstAction(summary: DailySummary | null, priority: PriorityTask | null): string {
  if (summary?.sugerencia_del_dia) return summary.sugerencia_del_dia
  if (priority) {
    const when = priority.fecha_limite
      ? `${formatRelativeDate(priority.fecha_limite)}, ${formatTaskDeadline(priority.fecha_limite)}`
      : 'sin fecha · sin hora'
    return `Empieza por: ${priority.titulo} (${when}).`
  }
  return 'Tu día no tiene una acción crítica pendiente.'
}

export function ExecutiveBrief({
  refreshKey = 0,
  googleConnected = false,
}: ExecutiveBriefProps) {
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [priorities, setPriorities] = useState<PriorityTask[]>([])
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [conflictCount, setConflictCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const requests: Promise<void>[] = [
      apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${todayISO()}`)
        .then((data) => { if (!cancelled) setEvents(data.eventos) }),
      apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente')
        .then((data) => { if (!cancelled) setTasks(data.tareas) }),
      apiFetch<PrioritiesResponse>('/api/priorities/today')
        .then((data) => { if (!cancelled) setPriorities(data.tareas) }),
      apiFetch<DailySummary>('/api/daily-summary')
        .then((data) => { if (!cancelled) setSummary(data) }),
    ]

    if (googleConnected) {
      requests.push(
        fetch('/api/calendar/conflicts', {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
          .then((res) => (res.ok ? res.json() : { conflictos: [] }))
          .then((data: ConflictResponse) => {
            if (!cancelled) setConflictCount(data.conflictos?.length ?? 0)
          })
      )
    } else {
      setConflictCount(0)
    }

    Promise.allSettled(requests)
      .then((results) => {
        if (cancelled) return
        const rejected = results.find((result) => result.status === 'rejected')
        if (rejected && rejected.status === 'rejected') {
          setError(rejected.reason instanceof Error ? rejected.reason.message : 'No se pudo cargar el briefing.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [refreshKey, googleConnected])

  const topPriority = priorities[0] ?? null
  const overdueCount = useMemo(() => {
    const today = todayISO()
    return tasks.filter((task) => task.fecha_limite && task.fecha_limite < today).length
  }, [tasks])

  const dayState = conflictCount > 0 || overdueCount > 0
    ? 'Requiere atención'
    : events.length >= 5 || priorities.length >= 3
      ? 'Día intenso'
      : 'Día controlado'

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 text-white shadow-[0_24px_70px_rgba(28,25,23,0.22)]">
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-stone-300">{formatToday()}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              {loading ? 'Preparando tu día' : dayState}
            </h1>
          </div>
          {topPriority && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200">
              Requiere atención
            </span>
          )}
        </div>

        {error ? (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        ) : (
          <>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-200">
              {loading
                ? 'Reuniendo agenda, foco y posibles bloqueos.'
                : firstAction(summary, topPriority)}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
              <div className="rounded-xl bg-white/8 px-2.5 py-3 ring-1 ring-white/10 sm:px-3">
                <p className="text-xl font-semibold tabular-nums">{events.length}</p>
                <p className="mt-0.5 text-[11px] text-stone-300">reuniones</p>
              </div>
              <div className="rounded-xl bg-white/8 px-2.5 py-3 ring-1 ring-white/10 sm:px-3">
                <p className="text-xl font-semibold tabular-nums">{priorities.slice(0, 3).length}</p>
                <p className="mt-0.5 text-[11px] text-stone-300">foco</p>
              </div>
              <div className="rounded-xl bg-white/8 px-2.5 py-3 ring-1 ring-white/10 sm:px-3">
                <p className="text-xl font-semibold tabular-nums">{conflictCount + overdueCount}</p>
                <p className="mt-0.5 text-[11px] text-stone-300">alertas</p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
