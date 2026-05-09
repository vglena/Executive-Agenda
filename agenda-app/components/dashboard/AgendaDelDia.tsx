'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { AgendaEvent } from '@/lib/types/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatTimeRange } from '@/lib/utils/display-time'

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

  return (
    <Card title="Agenda" description="Compromisos con hora definida.">
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && eventos.length === 0 && (
        <EmptyState
          title="Sin reuniones hoy."
          description="Buen espacio para foco profundo o cierre de pendientes."
        />
      )}
      {!loading && !error && eventos.length > 0 && (
        <ul className="space-y-3">
          {eventos.map((ev) => (
            <li key={ev.id} className="flex items-start gap-3 rounded-lg px-1 py-1">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" title="Evento" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-stone-950">{ev.titulo}</p>
                  {ev.conflicto_detectado && (
                    <Badge variant="conflicto" label="Conflicto" />
                  )}
                </div>
                <p className="mt-0.5 text-xs tabular-nums text-stone-400">
                  <span className="sm:hidden">{formatTimeRange(ev.fecha, ev.hora_inicio, ev.hora_fin, 'compact')}</span>
                  <span className="hidden sm:inline">{formatTimeRange(ev.fecha, ev.hora_inicio, ev.hora_fin, 'long')}</span>
                </p>
                {ev.ubicacion && (
                  <p className="mt-0.5 truncate text-xs text-stone-400">{ev.ubicacion}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
