'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { AgendaEvent, Task } from '@/lib/types/api'

function todayISO(): string { return new Date().toISOString().split('T')[0] }

type Kind = 'alert' | 'upcoming' | 'insight' | 'tip'

interface Suggestion { id: string; kind: Kind; title: string; body: string; cta?: string; onCta?: () => void }

function SuggestionCard({ s }: { s: Suggestion }) {
  const styles: Record<Kind, { wrap: string; dot: string; title: string; body: string }> = {
    alert:    { wrap: 'bg-rose-50 ring-1 ring-rose-100/80',   dot: 'bg-rose-400',   title: 'text-rose-800',   body: 'text-rose-600' },
    upcoming: { wrap: 'bg-blue-50/80 ring-1 ring-blue-100/80', dot: 'bg-blue-400',  title: 'text-blue-800',   body: 'text-blue-600' },
    insight:  { wrap: 'bg-amber-50/80 ring-1 ring-amber-100', dot: 'bg-amber-400',  title: 'text-amber-800',  body: 'text-amber-700' },
    tip:      { wrap: 'bg-stone-50 ring-1 ring-stone-100',     dot: 'bg-stone-300',  title: 'text-stone-700',  body: 'text-stone-400' },
  }
  const st = styles[s.kind]
  return (
    <div className={`rounded-2xl px-4 py-3.5 ${st.wrap}`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${st.title}`}>{s.title}</p>
          <p className={`mt-0.5 text-xs leading-relaxed ${st.body}`}>{s.body}</p>
          {s.cta && s.onCta && (
            <button onClick={s.onCta} className="mt-2 text-xs font-semibold underline underline-offset-2 transition hover:opacity-70">
              {s.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function buildSuggestions(events: AgendaEvent[], tasks: Task[], today: string, onCrear?: () => void): Suggestion[] {
  const out: Suggestion[] = []
  const overdue = tasks.filter((t) => t.fecha_limite && t.fecha_limite < today)
  const p1 = tasks.filter((t) => t.prioridad_manual === 'P1')
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const upcoming = events
    .filter((ev) => { const [hh, mm] = ev.hora_inicio.split(':').map(Number); return hh * 60 + mm > nowMin })
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  const hours = new Date().getHours()

  if (overdue.length > 0) out.push({
    id: 'overdue', kind: 'alert',
    title: overdue.length === 1 ? 'Tienes 1 tarea vencida' : `Tienes ${overdue.length} tareas vencidas`,
    body: 'Cada d\u00eda que pasan acumulan costo. Ci\u00e9rralas o red\u00e9finel\u00e0s hoy.',
  })

  if (upcoming.length > 0) {
    const next = upcoming[0]
    const [hh, mm] = next.hora_inicio.split(':').map(Number)
    const mins = hh * 60 + mm - nowMin
    if (mins <= 30) {
      out.push({ id: 'imminent', kind: 'upcoming',
        title: `"${next.titulo}" empieza en ${mins} min`,
        body: next.ubicacion ? `Lugar: ${next.ubicacion}` : '\u00bfTienes todo lo necesario?',
      })
    } else if (mins <= 120) {
      out.push({ id: 'soon', kind: 'upcoming',
        title: `Pr\u00f3xima reuni\u00f3n a las ${next.hora_inicio}`,
        body: `"${next.titulo}"${next.ubicacion ? ` \u00b7 ${next.ubicacion}` : ''}`,
      })
    }
  }

  if (p1.length > 0) out.push({
    id: 'p1', kind: 'insight',
    title: p1.length === 1 ? '1 decisi\u00f3n urgente sin resolver' : `${p1.length} decisiones urgentes sin resolver`,
    body: 'Est\u00e1n marcadas como urgentes. \u00bfPuedes resolverlas hoy?',
  })

  if (events.length === 0 && tasks.length === 0) {
    out.push(
      { id: 'start1', kind: 'tip', title: 'Empieza tu agenda ejecutiva', body: 'Agrega tus reuniones para tener visibilidad del d\u00eda.', cta: '+ Crear reuni\u00f3n', onCta: onCrear },
      { id: 'start2', kind: 'tip', title: 'Define tus prioridades', body: 'Registra las 3 cosas m\u00e1s importantes que debes hacer esta semana.', cta: '+ Crear tarea', onCta: onCrear },
    )
  }

  if (out.length < 2) {
    if (hours < 10) out.push({ id: 'morning', kind: 'tip', title: 'Revisi\u00f3n matutina', body: '\u00bfCu\u00e1l es la cosa m\u00e1s importante que debes lograr hoy antes de entrar en modo operativo?' })
    else if (hours < 14) out.push({ id: 'midday', kind: 'tip', title: 'Mitad del d\u00eda', body: '\u00bfVas en la direcci\u00f3n correcta? Revisa tu lista y ajusta si hace falta.' })
    else if (hours < 18) out.push({ id: 'afternoon', kind: 'tip', title: 'Cierre de tarde', body: '\u00bfQu\u00e9 puedes cerrar antes del final del d\u00eda para no arrastrarlo a ma\u00f1ana?' })
    else out.push({ id: 'evening', kind: 'tip', title: 'Cierre del d\u00eda', body: 'Anota qu\u00e9 qued\u00f3 pendiente y qu\u00e9 tiene que pasar ma\u00f1ana.', cta: '+ Registrar pendiente', onCta: onCrear })
  }

  if (out.length < 2) out.push({ id: 'week', kind: 'tip', title: 'Planea la semana', body: 'Revisa los pr\u00f3ximos d\u00edas y aseg\u00farate de que tus prioridades est\u00e1n en la agenda.' })

  return out.slice(0, 3)
}

export function PrepRecomendada({ refreshKey = 0, onCrear }: { refreshKey?: number; onCrear?: () => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    const today = todayISO()
    Promise.allSettled([
      apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${today}`).then((d) => d.eventos),
      apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente').then((d) => d.tareas),
    ]).then(([evRes, taskRes]) => {
      const events = evRes.status === 'fulfilled' ? evRes.value : []
      const tasks = taskRes.status === 'fulfilled' ? taskRes.value : []
      setSuggestions(buildSuggestions(events, tasks, today, onCrear))
    })
  }, [refreshKey, onCrear])

  if (suggestions.length === 0) return null

  const hours = new Date().getHours()
  const header = hours < 10 ? 'Para empezar bien el d\u00eda' : hours < 14 ? 'Ahora mismo' : hours < 18 ? 'Para cerrar la tarde' : 'Antes de cerrar el d\u00eda'

  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      <div className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-stone-950">{header}</h2>
        <div className="space-y-2">
          {suggestions.map((s) => <SuggestionCard key={s.id} s={s} />)}
        </div>
      </div>
    </div>
  )
}
