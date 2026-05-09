'use client'

import { useState, FormEvent } from 'react'
import { apiFetch } from '@/lib/api/client'

interface QuickAddEventProps {
  onCreated: () => void
}

function defaultHora(): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d.toTimeString().slice(0, 5)
}

function addHour(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + 60
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function QuickAddEvent({ onCreated }: QuickAddEventProps) {
  const todayISO = new Date().toISOString().split('T')[0]
  const horaInicioDef = defaultHora()

  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState(todayISO)
  const [horaInicio, setHoraInicio] = useState(horaInicioDef)
  const [horaFin, setHoraFin] = useState(addHour(horaInicioDef))
  const [expanded, setExpanded] = useState(false)
  const [ubicacion, setUbicacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)

  function validateHoras(): string | null {
    if (horaInicio >= horaFin) return 'hora_fin debe ser posterior a hora_inicio.'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('El título es obligatorio.')
      return
    }
    const horaError = validateHoras()
    if (horaError) {
      setError(horaError)
      return
    }
    setError(null)
    setConflicto(false)
    setLoading(true)
    try {
      type EventResponse = { evento: { conflicto_detectado: boolean } }
      const { evento } = await apiFetch<EventResponse>('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          titulo: titulo.trim(),
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          ...(ubicacion.trim() ? { ubicacion: ubicacion.trim() } : {}),
          ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
        }),
      })
      if (evento.conflicto_detectado) setConflicto(true)
      setTitulo('')
      setFecha(todayISO)
      const h = defaultHora()
      setHoraInicio(h)
      setHoraFin(addHour(h))
      setUbicacion('')
      setDescripcion('')
      setExpanded(false)
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear evento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nombre de la reunión o compromiso..."
          maxLength={200}
          className="tap-target min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-950 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
        />
        <button
          type="submit"
          disabled={loading || !titulo.trim()}
          className="tap-target rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="tap-target rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
        />
        <input
          type="time"
          value={horaInicio}
          onChange={(e) => {
            setHoraInicio(e.target.value)
            setHoraFin(addHour(e.target.value))
          }}
          className="tap-target rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
        />
        <input
          type="time"
          value={horaFin}
          onChange={(e) => setHoraFin(e.target.value)}
          className="tap-target rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="tap-target rounded-xl px-3 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
        >
          {expanded ? 'Ocultar detalles' : 'Detalles'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2">
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Ubicación opcional..."
            maxLength={300}
            className="tap-target w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
          />
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Contexto opcional..."
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
          />
        </div>
      )}

      <div className="min-h-[28px]">
        {conflicto && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
            Conflicto de horario detectado.
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        )}
      </div>
    </form>
  )
}
