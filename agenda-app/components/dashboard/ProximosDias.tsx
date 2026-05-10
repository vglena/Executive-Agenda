'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { AgendaEvent } from '@/lib/types/api'
import { Spinner } from '@/components/ui/Spinner'

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface DayGroup {
  fecha: string
  label: string
  eventos: AgendaEvent[]
}

function getNextDays(count: number): { fecha: string; label: string }[] {
  const result: { fecha: string; label: string }[] = []
  for (let i = 1; i <= count; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const fecha = d.toISOString().split('T')[0]
    const label =
      i === 1
        ? 'Mañana'
        : d
            .toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })
            .replace(/^./, (c) => c.toUpperCase())
    result.push({ fecha, label })
  }
  return result
}

// ─── ProximosDias ─────────────────────────────────────────────────────────────

export function ProximosDias({ refreshKey = 0 }: { refreshKey?: number }) {
  const [days, setDays] = useState<DayGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const targets = getNextDays(3)

    Promise.allSettled(
      targets.map(({ fecha }) =>
        apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${fecha}`)
          .then((data) => data.eventos)
          .catch(() => [] as AgendaEvent[]),
      ),
    )
      .then((results) => {
        const dayGroups: DayGroup[] = targets
          .map(({ fecha, label }, i) => ({
            fecha,
            label,
            eventos: results[i].status === 'fulfilled' ? results[i].value : [],
          }))
          .filter((d) => d.eventos.length > 0)
        setDays(dayGroups)
      })
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-stone-950">Próximos días</h2>
        <Spinner />
      </section>
    )
  }

  if (days.length === 0) return null

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-stone-950">Próximos días</h2>
      <div className="space-y-5">
        {days.map((day) => (
          <div key={day.fecha}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              {day.label}
            </p>
            <ul className="divide-y divide-stone-100">
              {day.eventos.map((ev) => (
                <li key={ev.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="w-11 shrink-0 text-xs tabular-nums text-stone-400">
                    {ev.hora_inicio}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-snug text-stone-800">{ev.titulo}</p>
                  {ev.conflicto_detectado && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      revisar
                    </span>
                  )}
                  {ev.ubicacion && !ev.conflicto_detectado && (
                    <span className="max-w-[6rem] shrink-0 truncate text-[10px] text-stone-400">
                      {ev.ubicacion}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
