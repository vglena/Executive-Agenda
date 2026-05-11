'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { AgendaEvent, Task } from '@/lib/types/api'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function buildBrief(events: AgendaEvent[], tasks: Task[]): string[] {
  const lines: string[] = []

  // Línea 1: eventos de hoy
  if (events.length === 0) {
    lines.push('Sin compromisos fijos en el calendario hoy.')
  } else {
    const now = new Date()
    const upcoming = events.filter((e) => {
      const [h, m] = e.hora_inicio.split(':').map(Number)
      const start = new Date(now)
      start.setHours(h, m, 0, 0)
      return start > now
    })
    if (upcoming.length > 0) {
      const next = upcoming[0]
      lines.push(
        `${events.length} ${events.length === 1 ? 'compromiso' : 'compromisos'} hoy — próximo: ${next.titulo} a las ${next.hora_inicio}.`,
      )
    } else {
      lines.push(
        `${events.length} ${events.length === 1 ? 'compromiso hoy, ya pasado' : 'compromisos hoy, todos completados'}.`,
      )
    }
  }

  // Línea 2: tareas urgentes o vencidas
  const today = todayISO()
  const vencidas = tasks.filter((t) => t.fecha_limite && t.fecha_limite < today)
  const urgentes = tasks.filter((t) => t.prioridad_manual === 'P1')

  if (vencidas.length > 0) {
    lines.push(
      `${vencidas.length} ${vencidas.length === 1 ? 'tarea vencida' : 'tareas vencidas'} requieren atención inmediata.`,
    )
  } else if (urgentes.length > 0) {
    lines.push(
      `${urgentes.length} ${urgentes.length === 1 ? 'tarea urgente' : 'tareas urgentes'} pendientes.`,
    )
  } else if (tasks.length > 0) {
    lines.push(`${tasks.length} ${tasks.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}.`)
  }

  return lines.slice(0, 2)
}

export function BriefEjecutivo({ refreshKey = 0 }: { refreshKey?: number }) {
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    Promise.allSettled([
      apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${todayISO()}`).then((d) => d.eventos),
      apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente').then((d) => d.tareas),
    ]).then(([evRes, taskRes]) => {
      const events = evRes.status === 'fulfilled' ? evRes.value : []
      const tasks = taskRes.status === 'fulfilled' ? taskRes.value : []
      setLines(buildBrief(events, tasks))
    })
  }, [refreshKey])

  if (lines.length === 0) return null

  return (
    <div className="px-1 pt-1 pb-2">
      {lines.map((line, i) => (
        <p key={i} className="text-sm leading-relaxed text-stone-500">
          {line}
        </p>
      ))}
    </div>
  )
}
