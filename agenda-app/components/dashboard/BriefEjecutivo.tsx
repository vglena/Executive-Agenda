'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { AgendaEvent, Task, Reminder } from '@/lib/types/api'

const IS_DEV = process.env.NODE_ENV === 'development'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

interface CockpitData {
  eventCount: number
  taskCount: number
  overdueCount: number
  reminderCount: number
  nextEvent: AgendaEvent | null
}

function StatCell({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-4">
      <span className={`text-[26px] font-bold tabular-nums leading-none ${accent}`}>{value}</span>
      <span className="mt-1 text-center text-[9px] font-semibold uppercase tracking-wide text-stone-400 leading-tight">{label}</span>
    </div>
  )
}

export function BriefEjecutivo({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<CockpitData | null>(null)

  useEffect(() => {
    const today = todayISO()
    Promise.allSettled([
      apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${today}`).then((d) => d.eventos),
      apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente').then((d) => d.tareas),
      apiFetch<{ recordatorios: Reminder[]; total: number }>('/api/reminders?estado=activo')
        .then((d) => d.total)
        .catch(() => 0),
    ]).then(([evRes, taskRes, remRes]) => {
      let events: AgendaEvent[] = evRes.status === 'fulfilled' ? evRes.value : []
      let tasks: Task[] = taskRes.status === 'fulfilled' ? taskRes.value : []
      const reminderCount: number = remRes.status === 'fulfilled' ? (remRes.value as number) : 0

      // ── Dev demo ──
      if (IS_DEV && events.length === 0) {
        events = [
          { id: '__d1', titulo: 'Revisi\u00f3n del equipo', fecha: today, hora_inicio: '12:00', hora_fin: '13:00', descripcion: null, ubicacion: 'Google Meet', estado: 'activo', conflicto_detectado: false, created_at: '' },
          { id: '__d2', titulo: 'Llamada con cliente estrat\u00e9gico', fecha: today, hora_inicio: '14:00', hora_fin: '15:00', descripcion: null, ubicacion: null, estado: 'activo', conflicto_detectado: false, created_at: '' },
        ]
      }
      if (IS_DEV && tasks.length === 0) {
        tasks = [
          { id: '__t1', titulo: 'Preparar propuesta Q3', descripcion: null, fecha_limite: '2026-05-10', prioridad_manual: 'P1', estado: 'pendiente', created_at: '', completed_at: null },
          { id: '__t2', titulo: 'Revisar contrato proveedor', descripcion: null, fecha_limite: today, prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
          { id: '__t3', titulo: 'Actualizar presentaci\u00f3n inversores', descripcion: null, fecha_limite: '2026-05-14', prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
          { id: '__t4', titulo: 'Definir roadmap siguiente trimestre', descripcion: null, fecha_limite: null, prioridad_manual: 'P1', estado: 'pendiente', created_at: '', completed_at: null },
        ]
      }

      const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
      const nextEvent = events.find((ev) => {
        const [hh, mm] = ev.hora_inicio.split(':').map(Number)
        return hh * 60 + mm > nowMin
      }) ?? null

      setData({
        eventCount: events.length,
        taskCount: tasks.length,
        overdueCount: tasks.filter((t) => t.fecha_limite && t.fecha_limite < today).length,
        reminderCount,
        nextEvent,
      })
    })
  }, [refreshKey])

  if (!data) return null

  const { eventCount, taskCount, overdueCount, reminderCount, nextEvent } = data

  return (
    <div className="mb-3 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      {/* 4-stat cockpit */}
      <div className="grid grid-cols-4 divide-x divide-stone-50">
        <StatCell
          value={eventCount}
          label={'reuniones\nhoy'}
          accent={eventCount > 0 ? 'text-blue-600' : 'text-stone-300'}
        />
        <StatCell
          value={taskCount}
          label={'tareas\nabiertas'}
          accent={taskCount > 0 ? 'text-stone-900' : 'text-stone-300'}
        />
        <StatCell
          value={overdueCount}
          label={overdueCount === 1 ? 'tarea\nvencida' : 'tareas\nvencidas'}
          accent={overdueCount > 0 ? 'text-rose-600' : 'text-stone-300'}
        />
        <StatCell
          value={reminderCount}
          label={reminderCount === 1 ? 'recorda-\ntorio' : 'recorda-\ntorios'}
          accent={reminderCount > 0 ? 'text-amber-600' : 'text-stone-300'}
        />
      </div>

      {/* Alert strip */}
      {(nextEvent || overdueCount > 0) && (
        <div className="flex flex-col gap-1.5 border-t border-stone-50 px-3 py-2.5">
          {nextEvent && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50/80 px-3 py-2">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blue-500" />
              <p className="min-w-0 truncate text-xs font-medium text-blue-700">
                Pr\u00f3ximo: {nextEvent.titulo} \u00b7 {nextEvent.hora_inicio}
              </p>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              <p className="text-xs font-medium text-rose-700">
                {overdueCount === 1 ? '1 tarea vencida sin resolver' : `${overdueCount} tareas vencidas sin resolver`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
