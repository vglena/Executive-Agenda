'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { AgendaEvent, Task } from '@/lib/types/api'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

interface Stats {
  eventCount: number
  pendingCount: number
  overdueCount: number
  nextEvent: AgendaEvent | null
}

function StatCell({
  value,
  label,
  color,
}: {
  value: number
  label: string
  color: 'blue' | 'rose' | 'stone'
}) {
  const numColor =
    color === 'blue'
      ? 'text-blue-600'
      : color === 'rose' && value > 0
        ? 'text-rose-600'
        : 'text-stone-950'
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-stone-50 px-2 py-3">
      <span className={`text-2xl font-bold tabular-nums leading-none ${numColor}`}>{value}</span>
      <span className="text-center text-[10px] font-medium leading-tight text-stone-400">{label}</span>
    </div>
  )
}

export function BriefEjecutivo({ refreshKey = 0 }: { refreshKey?: number }) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const today = todayISO()
    Promise.allSettled([
      apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${today}`).then((d) => d.eventos),
      apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente').then((d) => d.tareas),
    ]).then(([evRes, taskRes]) => {
      const events = evRes.status === 'fulfilled' ? evRes.value : []
      const tasks = taskRes.status === 'fulfilled' ? taskRes.value : []
      const now = new Date()
      const overdueCount = tasks.filter((t) => t.fecha_limite && t.fecha_limite < today).length
      const nextEvent =
        events.find((ev) => {
          const [h, m] = ev.hora_inicio.split(':').map(Number)
          const start = new Date(now)
          start.setHours(h, m, 0, 0)
          return start > now
        }) ?? null
      setStats({ eventCount: events.length, pendingCount: tasks.length, overdueCount, nextEvent })
    })
  }, [refreshKey])

  if (!stats) return null

  const { eventCount, pendingCount, overdueCount, nextEvent } = stats

  return (
    <div className="mb-3 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <StatCell
          value={eventCount}
          label="eventos hoy"
          color={eventCount > 0 ? 'blue' : 'stone'}
        />
        <StatCell value={pendingCount} label="pendientes" color="stone" />
        <StatCell
          value={overdueCount}
          label={overdueCount === 1 ? 'vencida' : 'vencidas'}
          color="rose"
        />
      </div>

      {/* Contextual alerts */}
      {(nextEvent || overdueCount > 0) && (
        <div className="space-y-1.5 border-t border-stone-50 px-3 pb-3 pt-1">
          {nextEvent && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50/80 px-3 py-2">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blue-500" />
              <p className="min-w-0 truncate text-xs font-medium text-blue-700">
                Próximo: {nextEvent.titulo} · {nextEvent.hora_inicio}
              </p>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              <p className="text-xs font-medium text-rose-700">
                {overdueCount === 1
                  ? '1 tarea vencida sin atender'
                  : `${overdueCount} tareas vencidas sin atender`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
