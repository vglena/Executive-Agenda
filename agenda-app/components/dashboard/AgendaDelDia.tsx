'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { AgendaEvent } from '@/lib/types/api'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert "HH:MM" to minutes since midnight */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Current time in minutes since midnight */
function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

type TimeSlot = 'past' | 'current' | 'upcoming'

function timeSlot(ev: AgendaEvent): TimeSlot {
  const now = nowMinutes()
  const start = toMinutes(ev.hora_inicio)
  const end = toMinutes(ev.hora_fin)
  if (now >= end) return 'past'
  if (now >= start) return 'current'
  return 'upcoming'
}

function durationLabel(start: string, end: string): string {
  const mins = toMinutes(end) - toMinutes(start)
  if (mins <= 0) return ''
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

// ─── TimelineEvent ────────────────────────────────────────────────────────────

function TimelineEvent({
  ev,
  isLast,
}: {
  ev: AgendaEvent
  isLast: boolean
}) {
  const slot = timeSlot(ev)
  const duration = durationLabel(ev.hora_inicio, ev.hora_fin)

  // Dot and connector colours
  const dotClass =
    slot === 'current'
      ? 'bg-blue-500 ring-2 ring-blue-200 shadow-[0_0_6px_rgba(59,130,246,0.5)]'
      : slot === 'past'
        ? 'bg-stone-300'
        : ev.conflicto_detectado
          ? 'bg-amber-400 ring-2 ring-amber-100'
          : 'bg-stone-400'

  const lineClass = 'bg-stone-200'

  // Title and time text colours
  const titleClass =
    slot === 'past'
      ? 'text-stone-400'
      : slot === 'current'
        ? 'text-stone-950 font-semibold'
        : 'text-stone-800'

  const timeClass =
    slot === 'current'
      ? 'text-blue-600 font-semibold tabular-nums'
      : slot === 'past'
        ? 'text-stone-300 tabular-nums'
        : 'text-stone-500 tabular-nums'

  // Card background
  const cardClass =
    slot === 'current'
      ? 'bg-blue-50/60 ring-1 ring-blue-100'
      : ev.conflicto_detectado && slot !== 'past'
        ? 'bg-amber-50/70 ring-1 ring-amber-100'
        : 'bg-transparent'

  return (
    <li className="relative flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />
        {!isLast && (
          <span className={`mt-1 w-px flex-1 ${lineClass}`} style={{ minHeight: '1.5rem' }} />
        )}
      </div>

      {/* Content */}
      <div className={`mb-3 min-w-0 flex-1 rounded-xl px-3 py-2 ${cardClass}`}>
        {/* Time row */}
        <div className="flex items-baseline gap-2">
          <span className={`text-sm leading-none ${timeClass}`}>
            {ev.hora_inicio}
          </span>
          <span className={`text-xs ${slot === 'past' ? 'text-stone-300' : 'text-stone-400'}`}>
            –{ev.hora_fin}
          </span>
          {duration && (
            <span className={`ml-auto text-[10px] font-medium ${
              slot === 'past' ? 'text-stone-300' : 'text-stone-400'
            }`}>
              {duration}
            </span>
          )}
        </div>

        {/* Title */}
        <p className={`mt-1 text-sm leading-snug ${titleClass}`}>
          {ev.titulo}
        </p>

        {/* Meta row: location + status badges */}
        {(ev.ubicacion || ev.conflicto_detectado || slot === 'current') && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {slot === 'current' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Ahora
              </span>
            )}
            {ev.conflicto_detectado && slot !== 'past' && (
              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                requiere decisión
              </span>
            )}
            {ev.ubicacion && (
              <span className={`text-[10px] ${slot === 'past' ? 'text-stone-300' : 'text-stone-400'}`}>
                {ev.ubicacion}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

// ─── AgendaDelDia ─────────────────────────────────────────────────────────────

export function AgendaDelDia({ refreshKey = 0 }: { refreshKey?: number }) {
  const [eventos, setEventos] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const hoy = new Date().toISOString().split('T')[0]
    apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${hoy}`)
      .then((data) => setEventos(data.eventos))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const conflicts = eventos.filter((e) => e.conflicto_detectado && timeSlot(e) !== 'past').length

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-stone-950">Agenda</h2>
          <p className="mt-0.5 text-xs text-stone-400">
            {loading ? 'Cargando…' : eventos.length === 0 ? 'Sin compromisos hoy' : `${eventos.length} evento${eventos.length !== 1 ? 's' : ''} hoy`}
          </p>
        </div>
        {conflicts > 0 && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            {conflicts} conflicto{conflicts !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* States */}
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && eventos.length === 0 && (
        <EmptyState
          title="Sin reuniones hoy."
          description="Buen espacio para foco profundo o cierre de pendientes."
        />
      )}

      {/* Timeline */}
      {!loading && !error && eventos.length > 0 && (
        <ul className="space-y-0">
          {eventos.map((ev, i) => (
            <TimelineEvent
              key={ev.id}
              ev={ev}
              isLast={i === eventos.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
