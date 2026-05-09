'use client'

import { useState, useEffect, FormEvent } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Task, AgendaEvent } from '@/lib/types/api'
import { formatTimeRange } from '@/lib/utils/display-time'

interface QuickAddReminderProps {
  onCreated: () => void
}

const ANTELACION_OPTS = [
  { value: '15min', label: '15 min antes' },
  { value: '30min', label: '30 min antes' },
  { value: '1h', label: '1 hora antes' },
  { value: '3h', label: '3 horas antes' },
  { value: '1dia', label: '1 día antes' },
  { value: 'personalizado', label: 'Fecha/hora exacta' },
] as const

type AntelacionTipo = typeof ANTELACION_OPTS[number]['value']

export function QuickAddReminder({ onCreated }: QuickAddReminderProps) {
  const [entidadTipo, setEntidadTipo] = useState<'tarea' | 'evento'>('tarea')
  const [entidadId, setEntidadId] = useState('')
  const [antelacion, setAntelacion] = useState<AntelacionTipo>('1h')
  const [fechaDisparo, setFechaDisparo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tareas, setTareas] = useState<Task[]>([])
  const [eventos, setEventos] = useState<AgendaEvent[]>([])
  const [loadingEntidades, setLoadingEntidades] = useState(false)

  useEffect(() => {
    setLoadingEntidades(true)
    setEntidadId('')
    if (entidadTipo === 'tarea') {
      apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente')
        .then((d) => setTareas(d.tareas))
        .catch(() => null)
        .finally(() => setLoadingEntidades(false))
    } else {
      apiFetch<{ eventos: AgendaEvent[] }>('/api/events')
        .then((d) => setEventos(d.eventos))
        .catch(() => null)
        .finally(() => setLoadingEntidades(false))
    }
  }, [entidadTipo])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!entidadId) {
      setError(`Selecciona una ${entidadTipo}.`)
      return
    }
    if (antelacion === 'personalizado' && !fechaDisparo) {
      setError('Indica la fecha y hora exacta del recordatorio.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await apiFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({
          ...(entidadTipo === 'tarea' ? { task_id: entidadId } : { event_id: entidadId }),
          antelacion_tipo: antelacion,
          ...(antelacion === 'personalizado' ? { fecha_hora_disparo: new Date(fechaDisparo).toISOString() } : {}),
          ...(mensaje.trim() ? { mensaje: mensaje.trim() } : {}),
        }),
      })
      setEntidadId('')
      setAntelacion('1h')
      setFechaDisparo('')
      setMensaje('')
      setExpanded(false)
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear recordatorio.')
    } finally {
      setLoading(false)
    }
  }

  const opciones = entidadTipo === 'tarea' ? tareas : eventos

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        {(['tarea', 'evento'] as const).map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => setEntidadTipo(tipo)}
            className={`tap-target flex-1 rounded-xl text-sm font-semibold transition-colors ${
              entidadTipo === tipo
                ? 'bg-stone-950 text-white'
                : 'bg-white text-stone-600 ring-1 ring-inset ring-stone-200 hover:bg-stone-50'
            }`}
          >
            {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </button>
        ))}
      </div>

      <select
        value={entidadId}
        onChange={(e) => setEntidadId(e.target.value)}
        disabled={loadingEntidades}
        className="tap-target w-full rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-950 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70 disabled:opacity-50"
      >
        <option value="">
          {loadingEntidades
            ? 'Cargando...'
            : opciones.length === 0
              ? `Sin ${entidadTipo === 'tarea' ? 'tareas pendientes' : 'eventos'}`
              : `Selecciona una ${entidadTipo}...`}
        </option>
        {opciones.map((item) => (
          <option key={item.id} value={item.id}>
            {entidadTipo === 'tarea'
              ? (item as Task).titulo
              : `${formatTimeRange((item as AgendaEvent).fecha, (item as AgendaEvent).hora_inicio, (item as AgendaEvent).hora_fin, 'compact')} - ${(item as AgendaEvent).titulo}`}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={antelacion}
          onChange={(e) => setAntelacion(e.target.value as AntelacionTipo)}
          className="tap-target min-w-[180px] flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
        >
          {ANTELACION_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="tap-target rounded-xl px-3 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
        >
          {expanded ? 'Ocultar detalles' : 'Detalles'}
        </button>
      </div>

      {(expanded || antelacion === 'personalizado') && (
        <div className="space-y-2">
          {antelacion === 'personalizado' && (
            <input
              type="datetime-local"
              value={fechaDisparo}
              onChange={(e) => setFechaDisparo(e.target.value)}
              className="tap-target w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
            />
          )}
          {expanded && (
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Mensaje opcional..."
              maxLength={500}
              className="tap-target w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
            />
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !entidadId}
        className="tap-target w-full rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 sm:w-auto"
      >
        {loading ? 'Guardando...' : 'Guardar recordatorio'}
      </button>

      <div className="min-h-[28px]">
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        )}
      </div>
    </form>
  )
}
