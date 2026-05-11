'use client'

import { useState, useEffect, FormEvent } from 'react'
import { apiFetch } from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoActividad = 'evento' | 'tarea' | 'recordatorio' | 'decision'

const TIPOS: { id: TipoActividad; label: string; desc: string }[] = [
  { id: 'evento',       label: 'Evento',       desc: 'Reunión, llamada o cita con hora' },
  { id: 'tarea',        label: 'Tarea',         desc: 'Algo que hacer antes de una fecha' },
  { id: 'recordatorio', label: 'Recordatorio',  desc: 'Algo que no olvidar' },
  { id: 'decision',     label: 'Decisión',      desc: 'Algo que necesita tu respuesta' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultHora(): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d.toTimeString().slice(0, 5)
}

function addHour(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + 60
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ─── Form: Evento ─────────────────────────────────────────────────────────────

function FormEvento({ onCreated, onClose, defaultFecha }: { onCreated: () => void; onClose: () => void; defaultFecha?: string }) {
  const todayISO = new Date().toISOString().split('T')[0]
  const h0 = defaultHora()

  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState(defaultFecha ?? todayISO)
  const [horaInicio, setHoraInicio] = useState(h0)
  const [horaFin, setHoraFin] = useState(addHour(h0))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Escribe un título.'); return }
    if (horaInicio >= horaFin) { setError('La hora de fin debe ser posterior.'); return }
    setError(null)
    setLoading(true)
    try {
      await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({ titulo: titulo.trim(), fecha, hora_inicio: horaInicio, hora_fin: horaFin }),
      })
      onCreated()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-8">
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="¿De qué trata?"
        maxLength={200}
        autoFocus
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-stone-950 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
      />
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <label className="mb-1 block text-xs text-stone-400">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-stone-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-400">Inicio</label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-stone-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-400">Fin</label>
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-stone-400"
          />
        </div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !titulo.trim()}
        className="w-full rounded-xl bg-stone-950 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40"
      >
        {loading ? 'Guardando…' : 'Guardar evento'}
      </button>
    </form>
  )
}

// ─── Form: Tarea / Recordatorio / Decisión ────────────────────────────────────

function FormTarea({
  tipo,
  onCreated,
  onClose,
  defaultFecha,
}: {
  tipo: Exclude<TipoActividad, 'evento'>
  onCreated: () => void
  onClose: () => void
  defaultFecha?: string
}) {
  const labelMap: Record<Exclude<TipoActividad, 'evento'>, string> = {
    tarea: 'tarea',
    recordatorio: 'recordatorio',
    decision: 'decisión',
  }
  const placeholderMap: Record<Exclude<TipoActividad, 'evento'>, string> = {
    tarea: '¿Qué hay que hacer?',
    recordatorio: '¿Qué no debes olvidar?',
    decision: '¿Qué decisión está pendiente?',
  }
  // Decisiones siempre P1; recordatorios P2; tareas P2 por defecto
  const defaultPrioridad: Record<Exclude<TipoActividad, 'evento'>, 'P1' | 'P2' | 'P3'> = {
    tarea:        'P2',
    recordatorio: 'P2',
    decision:     'P1',
  }

  const [titulo, setTitulo] = useState('')
  const [fechaLimite, setFechaLimite] = useState(defaultFecha ?? '')
  const [prioridad, setPrioridad] = useState<'P1' | 'P2' | 'P3'>(defaultPrioridad[tipo])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Escribe un título.'); return }
    setError(null)
    setLoading(true)
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          titulo: titulo.trim(),
          prioridad_manual: prioridad,
          ...(fechaLimite ? { fecha_limite: fechaLimite } : {}),
        }),
      })
      onCreated()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-8">
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder={placeholderMap[tipo]}
        maxLength={200}
        autoFocus
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-stone-950 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
      />
      <div>
        <label className="mb-1 block text-xs text-stone-400">Fecha límite (opcional)</label>
        <input
          type="date"
          value={fechaLimite}
          onChange={(e) => setFechaLimite(e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-stone-400"
        />
      </div>
      {tipo !== 'decision' && (
        <div>
          <label className="mb-1 block text-xs text-stone-400">Urgencia</label>
          <div className="flex gap-2">
            {(['P1', 'P2', 'P3'] as const).map((val) => {
              const lbl = val === 'P1' ? 'Urgente' : val === 'P2' ? 'Importante' : 'Normal'
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPrioridad(val)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                    prioridad === val
                      ? 'bg-stone-950 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {lbl}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !titulo.trim()}
        className="w-full rounded-xl bg-stone-950 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40"
      >
        {loading ? 'Guardando…' : `Guardar ${labelMap[tipo]}`}
      </button>
    </form>
  )
}

// ─── CrearModal ───────────────────────────────────────────────────────────────

export function CrearModal({
  open,
  onClose,
  onCreated,
  defaultFecha,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  defaultFecha?: string
}) {
  const [tipo, setTipo] = useState<TipoActividad | null>(null)

  useEffect(() => {
    if (!open) setTipo(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const selectedTipo = TIPOS.find((t) => t.id === tipo)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 mx-auto w-full max-w-lg rounded-t-3xl bg-white shadow-2xl">
        {/* Handle */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-stone-200" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          {tipo ? (
            <button
              onClick={() => setTipo(null)}
              className="text-sm font-medium text-stone-400 transition hover:text-stone-700"
            >
              ← Volver
            </button>
          ) : (
            <span className="text-sm font-semibold text-stone-950">¿Qué quieres crear?</span>
          )}
          <button
            onClick={onClose}
            className="text-sm text-stone-400 transition hover:text-stone-700"
          >
            Cancelar
          </button>
        </div>

        {/* Content: type picker or form */}
        {!tipo ? (
          <div className="grid grid-cols-2 gap-2 px-4 pb-10">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className="flex flex-col gap-1 rounded-2xl border border-stone-100 bg-stone-50 p-4 text-left transition hover:border-stone-300 hover:bg-white active:scale-95"
              >
                <span className="text-sm font-semibold text-stone-950">{t.label}</span>
                <span className="text-xs leading-snug text-stone-400">{t.desc}</span>
              </button>
            ))}
          </div>
        ) : tipo === 'evento' ? (
          <FormEvento onCreated={onCreated} onClose={onClose} defaultFecha={defaultFecha} />
        ) : (
          <FormTarea
            tipo={tipo}
            onCreated={onCreated}
            onClose={onClose}
            defaultFecha={defaultFecha}
          />
        )}

        {/* Safe area spacer for iOS */}
        {selectedTipo && <div className="h-safe-bottom" />}
      </div>
    </div>
  )
}
