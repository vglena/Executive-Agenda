'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { AgendaEvent } from '@/lib/types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface DayData {
  fecha: string
  label: string
  eventos: AgendaEvent[]
}

function getNextDays(count: number): { fecha: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    const fecha = d.toISOString().split('T')[0]
    const label =
      i === 0
        ? 'Mañana'
        : d
            .toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })
            .replace(/^./, (c) => c.toUpperCase())
    return { fecha, label }
  })
}

// ─── ProximosDias ─────────────────────────────────────────────────────────────

export function ProximosDias({
  refreshKey = 0,
  onEventTap,
}: {
  refreshKey?: number
  onEventTap?: (ev: AgendaEvent) => void
}) {
  const [days, setDays] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const targets = getNextDays(4)
    Promise.allSettled(
      targets.map(({ fecha }) =>
        apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${fecha}`)
          .then((d) => d.eventos)
          .catch(() => [] as AgendaEvent[]),
      ),
    )
      .then((results) => {
        setDays(
          targets
            .map(({ fecha, label }, i) => ({
              fecha,
              label,
              eventos: results[i].status === 'fulfilled' ? results[i].value : [],
            }))
            .filter((d) => d.eventos.length > 0),
        )
      })
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading || days.length === 0) return null

  return (
    <section className="p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-stone-950">Próximos días</h2>
      <div className="space-y-4">
        {days.map((day) => (
          <div key={day.fecha}>
            <p className="mb-1.5 text-xs font-semibold text-stone-400">{day.label}</p>
            <div className="space-y-1">
              {day.eventos.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onEventTap?.(ev)}
                  className="flex w-full items-center gap-3 rounded-xl bg-stone-50/70 px-3 py-2.5 text-left transition active:bg-stone-100"
                >
                  <span className="w-10 shrink-0 text-xs tabular-nums text-stone-400">
                    {ev.hora_inicio}
                  </span>
                  <p className="min-w-0 flex-1 text-sm text-stone-700">{ev.titulo}</p>
                  {ev.conflicto_detectado && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      revisar
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
