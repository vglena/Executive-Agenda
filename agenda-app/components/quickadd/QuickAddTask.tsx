'use client'

import { useState, FormEvent } from 'react'
import { apiFetch } from '@/lib/api/client'

interface QuickAddTaskProps {
  onCreated: () => void
}

const PRIORIDADES = ['P1', 'P2', 'P3', 'P4'] as const
const PRIORIDAD_LABELS: Record<typeof PRIORIDADES[number], string> = {
  P1: 'Urgente',
  P2: 'Importante',
  P3: 'Normal',
  P4: 'Cuando pueda',
}

export function QuickAddTask({ onCreated }: QuickAddTaskProps) {
  const [titulo, setTitulo] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [prioridad, setPrioridad] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P3')
  const [expanded, setExpanded] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('El título es obligatorio.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          titulo: titulo.trim(),
          prioridad_manual: prioridad,
          ...(fechaLimite ? { fecha_limite: fechaLimite } : {}),
          ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
        }),
      })
      setTitulo('')
      setFechaLimite('')
      setPrioridad('P3')
      setDescripcion('')
      setExpanded(false)
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear tarea.')
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
          placeholder="Escribe la tarea..."
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

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={fechaLimite}
          onChange={(e) => setFechaLimite(e.target.value)}
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
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">
              Importancia
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as typeof prioridad)}
              className="tap-target w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70"
              aria-label="Ajuste manual opcional"
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>{PRIORIDAD_LABELS[p]}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-400">
              Indica cuánto pesa esta tarea en tu agenda.
            </p>
          </div>
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
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        )}
      </div>
    </form>
  )
}
