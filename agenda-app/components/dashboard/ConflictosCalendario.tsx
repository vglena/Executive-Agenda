'use client'

import { useEffect, useState, useCallback } from 'react'
import { getToken } from '@/lib/api/client'
import { formatTimeRange } from '@/lib/utils/display-time'

interface ConflictoEvento {
  id: string
  titulo: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  descripcion: string | null
}

interface Conflicto {
  id: string
  estado: string
  nota: string | null
  detected_at: string
  evento_google: ConflictoEvento
  evento_manual: ConflictoEvento
}

interface Props {
  refreshKey?: number
  onResolved?: () => void
}

function decisionText(conflicto: Conflicto): string {
  return `El evento de Google "${conflicto.evento_google.titulo}" coincide con "${conflicto.evento_manual.titulo}".`
}

function EventSourceCard({
  label,
  tone,
  event,
}: {
  label: string
  tone: 'google' | 'manual'
  event: ConflictoEvento
}) {
  const toneClasses = tone === 'google'
    ? 'border-blue-100 bg-blue-50/60 text-blue-700'
    : 'border-stone-200 bg-white text-stone-600'

  return (
    <div className={`rounded-xl border p-3 ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-stone-950">{event.titulo}</p>
      <p className="mt-1 text-xs tabular-nums text-stone-500">
        <span className="sm:hidden">{formatTimeRange(event.fecha, event.hora_inicio, event.hora_fin, 'compact')}</span>
        <span className="hidden sm:inline">{formatTimeRange(event.fecha, event.hora_inicio, event.hora_fin, 'long')}</span>
      </p>
    </div>
  )
}

export function ConflictosCalendario({ refreshKey, onResolved }: Props) {
  const [conflictos, setConflictos] = useState<Conflicto[]>([])
  const [loading, setLoading] = useState(true)
  const [resolviendo, setResolviendo] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/calendar/conflicts', {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) return
      const data = await res.json() as { conflictos: Conflicto[] }
      setConflictos(data.conflictos ?? [])
    } catch {
      // Sección opcional: no bloquea el dashboard.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar, refreshKey])

  async function resolver(id: string, estado: 'revisado' | 'ignorado') {
    setResolviendo(id)
    try {
      const res = await fetch(`/api/calendar/conflicts/${id}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        setConflictos((prev) => prev.filter((c) => c.id !== id))
        onResolved?.()
      }
    } catch {
      // Mantener silencioso: el usuario puede reintentar.
    } finally {
      setResolviendo(null)
    }
  }

  if (!loading && conflictos.length === 0) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/70 shadow-[0_18px_45px_rgba(120,53,15,0.08)]">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full px-4 py-4 text-left transition hover:bg-amber-100/50 sm:px-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-amber-700">Decisiones pendientes</p>
            <h2 className="mt-1 text-base font-semibold text-stone-950">
              Conflictos de calendario
              {conflictos.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                  {conflictos.length}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
              Revisa solapamientos antes de confiar en la agenda del día.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            {collapsed ? 'Mostrar' : 'Ocultar'}
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
          {loading ? (
            <div className="rounded-xl bg-white/70 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
              Cargando decisiones pendientes...
            </div>
          ) : (
            conflictos.map((c) => (
              <article key={c.id} className="rounded-2xl bg-white p-4 ring-1 ring-amber-100">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium capitalize text-amber-700">
                      <span className="sm:hidden">
                        {formatTimeRange(c.evento_google.fecha, c.evento_google.hora_inicio, c.evento_google.hora_fin, 'compact')}
                      </span>
                      <span className="hidden sm:inline">
                        {formatTimeRange(c.evento_google.fecha, c.evento_google.hora_inicio, c.evento_google.hora_fin, 'long')}
                      </span>
                    </p>
                    <h3 className="mt-1 text-base font-semibold leading-snug text-stone-950">
                      {decisionText(c)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      Importa porque dos fuentes muestran compromisos en la misma ventana. Conviene decidir si ya está revisado o si puede ignorarse.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <EventSourceCard label="Google Calendar" tone="google" event={c.evento_google} />
                  <EventSourceCard label="Manual" tone="manual" event={c.evento_manual} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => resolver(c.id, 'revisado')}
                    disabled={resolviendo === c.id}
                    className="tap-target rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
                  >
                    {resolviendo === c.id ? 'Guardando...' : 'Marcar revisado'}
                  </button>
                  <button
                    onClick={() => resolver(c.id, 'ignorado')}
                    disabled={resolviendo === c.id}
                    className="tap-target rounded-xl bg-stone-100 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-200 disabled:opacity-50"
                  >
                    Ignorar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  )
}
