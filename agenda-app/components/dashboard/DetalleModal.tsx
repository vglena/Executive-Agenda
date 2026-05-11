'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { AgendaEvent, Task } from '@/lib/types/api'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type DetalleItem =
  | { type: 'event'; data: AgendaEvent }
  | { type: 'task'; data: Task }

interface Props {
  item: DetalleItem | null
  onClose: () => void
  onUpdated: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deadlineLabel(fl: string | null): string {
  if (!fl) return ''
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const [y, m, d] = fl.split('-').map(Number)
  const t = new Date(y, m - 1, d)
  const diff = Math.round((t.getTime() - now.getTime()) / 86400000)
  if (diff < -1) return `Venció hace ${-diff} días`
  if (diff === -1) return 'Venció ayer'
  if (diff === 0) return 'Vence hoy'
  if (diff === 1) return 'Mañana'
  if (diff <= 6) {
    const day = t.toLocaleDateString('es', { weekday: 'long' })
    return day.charAt(0).toUpperCase() + day.slice(1)
  }
  return t.toLocaleDateString('es', { day: 'numeric', month: 'long' })
}

function durationLabel(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) return ''
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

function urgencyLabel(p: Task['prioridad_manual']): string | null {
  if (p === 'P1') return 'Urgente'
  if (p === 'P2') return 'Importante'
  return null
}

function urgencyBg(p: Task['prioridad_manual']): string {
  if (p === 'P1') return 'bg-rose-100 text-rose-700'
  if (p === 'P2') return 'bg-amber-100 text-amber-700'
  return 'bg-stone-100 text-stone-500'
}

// ─── CloseButton ──────────────────────────────────────────────────────────────

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Cerrar"
      className="mt-0.5 shrink-0 rounded-full p-2 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Volver"
      className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}

// ─── EventDetail ──────────────────────────────────────────────────────────────

function EventDetail({
  ev,
  onClose,
  onUpdated,
}: {
  ev: AgendaEvent
  onClose: () => void
  onUpdated: () => void
}) {
  const [view, setView] = useState<'detail' | 'edit'>('detail')
  const [titulo, setTitulo] = useState(ev.titulo)
  const [horaInicio, setHoraInicio] = useState(ev.hora_inicio)
  const [horaFin, setHoraFin] = useState(ev.hora_fin)
  const [ubicacion, setUbicacion] = useState(ev.ubicacion ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const duration = durationLabel(ev.hora_inicio, ev.hora_fin)

  async function handleSave() {
    setSaving(true)
    try {
      await apiFetch(`/api/events/${ev.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo: titulo.trim() || ev.titulo,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          ubicacion: ubicacion.trim() || null,
        }),
      })
      onUpdated()
      onClose()
    } catch { /* silently */ } finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await apiFetch(`/api/events/${ev.id}`, { method: 'DELETE' })
      onUpdated()
      onClose()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al borrar')
    } finally { setDeleting(false) }
  }

  if (view === 'edit') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => setView('detail')} />
          <h3 className="text-lg font-semibold text-stone-950">Editar evento</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Fin</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">Lugar (opcional)</label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200/60"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-stone-950 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={() => setView('detail')}
            className="rounded-xl px-4 py-2.5 text-sm text-stone-500 transition hover:bg-stone-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Evento</p>
          <h3 className="mt-0.5 text-xl font-semibold leading-snug text-stone-950">{ev.titulo}</h3>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* Meta */}
      <div className="rounded-2xl bg-stone-50 p-4 space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-stone-700">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-400" aria-hidden>
            <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
          </svg>
          <span>{ev.hora_inicio} – {ev.hora_fin}{duration ? ` · ${duration}` : ''}</span>
        </div>
        {ev.ubicacion && (
          <div className="flex items-center gap-2.5 text-sm text-stone-700">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-400" aria-hidden>
              <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span>{ev.ubicacion}</span>
          </div>
        )}
        {ev.conflicto_detectado && (
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-500" aria-hidden>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="text-xs font-semibold text-amber-700">Posible solapamiento — conviene revisar</span>
          </div>
        )}
        {ev.descripcion && (
          <p className="pt-1 text-sm leading-relaxed text-stone-600 border-t border-stone-100">{ev.descripcion}</p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setView('edit')}
            className="flex-1 rounded-xl bg-stone-100 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-200"
          >
            Editar
          </button>
          {delConfirm ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {deleting ? '…' : 'Confirmar borrado'}
            </button>
          ) : (
            <button
              onClick={() => setDelConfirm(true)}
              className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
            >
              Eliminar
            </button>
          )}
        </div>
        {delConfirm && (
          <button
            onClick={() => setDelConfirm(false)}
            className="w-full py-1.5 text-xs text-stone-400 transition hover:text-stone-600"
          >
            Cancelar
          </button>
        )}
        {deleteError && (
          <p className="text-center text-xs text-rose-600">{deleteError}</p>
        )}
      </div>
    </div>
  )
}

// ─── TaskDetail ───────────────────────────────────────────────────────────────

function TaskDetail({
  task,
  onClose,
  onUpdated,
}: {
  task: Task
  onClose: () => void
  onUpdated: () => void
}) {
  const [view, setView] = useState<'detail' | 'edit'>('detail')
  const [titulo, setTitulo] = useState(task.titulo)
  const [fechaLimite, setFechaLimite] = useState(task.fecha_limite ?? '')
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const deadline = deadlineLabel(task.fecha_limite)
  const urgency = urgencyLabel(task.prioridad_manual)

  async function handleComplete() {
    setCompleting(true)
    try {
      await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'completada' }),
      })
      onUpdated()
      onClose()
    } catch { /* silently */ } finally { setCompleting(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo: titulo.trim() || task.titulo,
          fecha_limite: fechaLimite || null,
        }),
      })
      onUpdated()
      setView('detail')
    } catch { /* silently */ } finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      onUpdated()
      onClose()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al borrar')
    } finally { setDeleting(false) }
  }

  if (view === 'edit') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => setView('detail')} />
          <h3 className="text-lg font-semibold text-stone-950">Editar</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">Descripción</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">Fecha límite</label>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-stone-950 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={() => setView('detail')}
            className="rounded-xl px-4 py-2.5 text-sm text-stone-500 transition hover:bg-stone-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Pendiente</p>
          <h3 className="mt-0.5 text-xl font-semibold leading-snug text-stone-950">{task.titulo}</h3>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* Meta */}
      <div className="rounded-2xl bg-stone-50 p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {urgency && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${urgencyBg(task.prioridad_manual)}`}>
              {urgency}
            </span>
          )}
          {deadline && (
            <span className="text-sm text-stone-600">{deadline}</span>
          )}
        </div>
        {task.descripcion && (
          <p className="pt-1 text-sm leading-relaxed text-stone-600 border-t border-stone-100">{task.descripcion}</p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleComplete}
          disabled={completing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {completing ? (
            'Completando…'
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Marcar como hecha
            </>
          )}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setView('edit')}
            className="flex-1 rounded-xl bg-stone-100 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-200"
          >
            Editar
          </button>
          {delConfirm ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {deleting ? '…' : 'Confirmar borrado'}
            </button>
          ) : (
            <button
              onClick={() => setDelConfirm(true)}
              className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
            >
              Eliminar
            </button>
          )}
        </div>
        {delConfirm && (
          <button
            onClick={() => setDelConfirm(false)}
            className="w-full py-1.5 text-xs text-stone-400 transition hover:text-stone-600"
          >
            Cancelar
          </button>
        )}
        {deleteError && (
          <p className="text-center text-xs text-rose-600">{deleteError}</p>
        )}
      </div>
    </div>
  )
}

// ─── DetalleModal ─────────────────────────────────────────────────────────────

export function DetalleModal({ item, onClose, onUpdated }: Props) {
  if (!item) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed bottom-0 left-0 right-0 z-[60] mx-auto max-w-2xl animate-slide-up rounded-t-3xl bg-white px-5 pb-safe pt-5 shadow-2xl max-h-[82vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="mb-5 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-stone-200" />
        </div>

        {item.type === 'event' ? (
          <EventDetail ev={item.data} onClose={onClose} onUpdated={onUpdated} />
        ) : (
          <TaskDetail task={item.data} onClose={onClose} onUpdated={onUpdated} />
        )}

        {/* Extra bottom breathing room above home indicator */}
        <div className="h-4" />
      </div>
    </>
  )
}
