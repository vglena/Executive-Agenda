'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { AgendaEvent, Task } from '@/lib/types/api'

// ─── Utilities ────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function isoFromYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function addDaysFromToday(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function formatMonthYear(date: Date): string {
  const s = date.toLocaleDateString('es', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function formatDayHeader(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const result = date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
  return result.charAt(0).toUpperCase() + result.slice(1)
}

function isDemoMode(): boolean {
  if (process.env.NODE_ENV === 'development') return true
  if (typeof window === 'undefined') return false
  return window.location.search.includes('demo')
}

// ─── Demo data ────────────────────────────────────────────────────────────────

function getDemoTasks(): Task[] {
  return [
    { id: '__ct1', titulo: 'Preparar propuesta Q3', descripcion: null, fecha_limite: addDaysFromToday(-1), prioridad_manual: 'P1', estado: 'pendiente', created_at: '', completed_at: null },
    { id: '__ct2', titulo: 'Revisar contrato proveedor', descripcion: null, fecha_limite: todayISO(), prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
    { id: '__ct3', titulo: 'Actualizar presentación inversores', descripcion: null, fecha_limite: addDaysFromToday(3), prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
    { id: '__ct4', titulo: 'Definir roadmap siguiente trimestre', descripcion: null, fecha_limite: addDaysFromToday(5), prioridad_manual: 'P1', estado: 'pendiente', created_at: '', completed_at: null },
    { id: '__ct5', titulo: 'Aprobar presupuesto marketing', descripcion: null, fecha_limite: addDaysFromToday(8), prioridad_manual: 'P2', estado: 'pendiente', created_at: '', completed_at: null },
  ]
}

function getDemoEventsForDay(isoDate: string): AgendaEvent[] {
  const pairs: [number, AgendaEvent[]][] = [
    [0, [
      { id: '__ce_t1', titulo: 'Sync con el equipo', fecha: addDaysFromToday(0), hora_inicio: '10:00', hora_fin: '10:30', descripcion: null, ubicacion: 'Google Meet', estado: 'activo', conflicto_detectado: false, created_at: '' },
      { id: '__ce_t2', titulo: 'Llamada con cliente estratégico', fecha: addDaysFromToday(0), hora_inicio: '15:00', hora_fin: '16:00', descripcion: null, ubicacion: null, estado: 'activo', conflicto_detectado: false, created_at: '' },
    ]],
    [1, [{ id: '__ce_1', titulo: 'Comité ejecutivo', fecha: addDaysFromToday(1), hora_inicio: '10:00', hora_fin: '11:30', descripcion: null, ubicacion: 'Sala A', estado: 'activo', conflicto_detectado: false, created_at: '' }]],
    [3, [{ id: '__ce_3', titulo: 'Presentación a inversores', fecha: addDaysFromToday(3), hora_inicio: '14:00', hora_fin: '15:30', descripcion: null, ubicacion: 'Zoom', estado: 'activo', conflicto_detectado: false, created_at: '' }]],
    [7, [{ id: '__ce_7', titulo: 'Review mensual', fecha: addDaysFromToday(7), hora_inicio: '09:00', hora_fin: '10:00', descripcion: null, ubicacion: 'Oficina', estado: 'activo', conflicto_detectado: false, created_at: '' }]],
    [10, [{ id: '__ce_10', titulo: 'Planning trimestral', fecha: addDaysFromToday(10), hora_inicio: '10:00', hora_fin: '12:00', descripcion: null, ubicacion: 'Sala de juntas', estado: 'activo', conflicto_detectado: false, created_at: '' }]],
  ]
  for (const [off, evs] of pairs) {
    if (addDaysFromToday(off) === isoDate) return evs
  }
  return []
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

function DayCell({
  day,
  isToday,
  isSelected,
  hasTask,
  hasEvent,
  onClick,
}: {
  day: number
  isToday: boolean
  isSelected: boolean
  hasTask: boolean
  hasEvent: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-11 flex-col items-center justify-start rounded-xl pt-1.5 pb-1 transition-all ${
        isSelected
          ? 'bg-stone-950 text-white'
          : isToday
          ? 'bg-blue-50 font-semibold text-blue-700'
          : 'text-stone-700 hover:bg-stone-50 active:bg-stone-100'
      }`}
    >
      <span className="text-[13px] font-medium leading-none">{day}</span>
      {(hasTask || hasEvent) && (
        <div className="mt-1 flex gap-0.5">
          {hasEvent && <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-400'}`} />}
          {hasTask && <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-rose-300' : 'bg-rose-400'}`} />}
        </div>
      )}
    </button>
  )
}

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({ event, onTap }: { event: AgendaEvent; onTap?: (ev: AgendaEvent) => void }) {
  const isDemo = event.id.startsWith('__')
  return (
    <button
      onClick={() => !isDemo && onTap?.(event)}
      className="flex w-full items-start gap-3 rounded-xl bg-blue-50/80 px-3 py-2.5 text-left transition active:bg-blue-100"
    >
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-blue-900">
          {event.titulo}
          {isDemo && <span className="ml-1.5 text-[10px] font-normal text-blue-300">demo</span>}
        </p>
        <p className="mt-0.5 text-xs text-blue-500">
          {event.hora_inicio}
          {event.hora_fin ? `–${event.hora_fin}` : ''}
          {event.ubicacion ? ` · ${event.ubicacion}` : ''}
        </p>
      </div>
    </button>
  )
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRowCal({ task, onTap }: { task: Task; onTap?: (t: Task) => void }) {
  const isDemo = task.id.startsWith('__')
  const today = todayISO()
  const isOverdue = !!(task.fecha_limite && task.fecha_limite < today)
  return (
    <button
      onClick={() => !isDemo && onTap?.(task)}
      className="flex w-full items-start gap-3 rounded-xl bg-rose-50/60 px-3 py-2.5 text-left transition active:bg-rose-100"
    >
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-stone-700">
          {task.titulo}
          {isDemo && <span className="ml-1.5 text-[10px] font-normal text-stone-300">demo</span>}
        </p>
        {isOverdue && <p className="mt-0.5 text-xs text-rose-500">Vencida</p>}
      </div>
      {task.prioridad_manual === 'P1' && (
        <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
          Urgente
        </span>
      )}
    </button>
  )
}

// ─── CalendarioModal ──────────────────────────────────────────────────────────

export interface CalendarioModalProps {
  open: boolean
  onClose: () => void
  onCrear: () => void
  onEventTap?: (ev: AgendaEvent) => void
  onTaskTap?: (task: Task) => void
}

export function CalendarioModal({ open, onClose, onCrear, onEventTap, onTaskTap }: CalendarioModalProps) {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState(todayISO)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [dayCache, setDayCache] = useState<Map<string, AgendaEvent[]>>(new Map())
  const [loadingDay, setLoadingDay] = useState(false)

  // Load events for a given day, with demo fallback
  const loadDay = useCallback(
    (isoDate: string) => {
      setLoadingDay(true)
      apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${isoDate}`)
        .then((d) => {
          const real = d.eventos
          const events = isDemoMode() && real.length === 0 ? getDemoEventsForDay(isoDate) : real
          setDayCache((prev) => new Map(prev).set(isoDate, events))
        })
        .catch(() => {
          setDayCache((prev) => new Map(prev).set(isoDate, isDemoMode() ? getDemoEventsForDay(isoDate) : []))
        })
        .finally(() => setLoadingDay(false))
    },
    [],
  )

  // Load all tasks (for dot indicators) when modal opens
  useEffect(() => {
    if (!open) return
    apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente')
      .then((d) => {
        const real = d.tareas
        setAllTasks(isDemoMode() && real.length === 0 ? getDemoTasks() : real)
      })
      .catch(() => setAllTasks(isDemoMode() ? getDemoTasks() : []))
  }, [open])

  // Load selected day's events when modal first opens
  useEffect(() => {
    if (!open) return
    const today = todayISO()
    if (!dayCache.has(today)) loadDay(today)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectDay(isoDate: string) {
    setSelectedDay(isoDate)
    if (!dayCache.has(isoDate)) loadDay(isoDate)
  }

  if (!open) return null

  // Calendar grid
  const year = month.getFullYear()
  const monthIdx = month.getMonth()
  const daysCount = new Date(year, monthIdx + 1, 0).getDate()
  const firstWd = (new Date(year, monthIdx, 1).getDay() + 6) % 7 // Mon=0
  const cells: (number | null)[] = [
    ...Array<null>(firstWd).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = todayISO()
  const taskDotDays = new Set(allTasks.filter((t) => t.fecha_limite).map((t) => t.fecha_limite!))
  const eventDotDays = new Set(
    Array.from(dayCache.entries())
      .filter(([, evs]) => evs.length > 0)
      .map(([d]) => d),
  )

  const dayEvents = dayCache.get(selectedDay) ?? []
  const dayTasks = allTasks.filter((t) => t.fecha_limite === selectedDay)

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white animate-slide-up">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-3">
        <h2 className="text-base font-semibold text-stone-950">Calendario</h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          aria-label="Cerrar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
        <button
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
          aria-label="Mes anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm font-semibold capitalize text-stone-900">{formatMonthYear(month)}</span>
        <button
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
          aria-label="Mes siguiente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid shrink-0 grid-cols-7 px-3 pb-1">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <span key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">
            {d}
          </span>
        ))}
      </div>

      {/* Calendar day grid */}
      <div className="grid shrink-0 grid-cols-7 gap-0.5 px-3">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="h-11" />
          const iso = isoFromYMD(year, monthIdx, day)
          return (
            <DayCell
              key={iso}
              day={day}
              isToday={iso === today}
              isSelected={iso === selectedDay}
              hasTask={taskDotDays.has(iso)}
              hasEvent={eventDotDays.has(iso)}
              onClick={() => handleSelectDay(iso)}
            />
          )
        })}
      </div>

      {/* Day detail */}
      <div className="mt-2 flex-1 overflow-y-auto border-t border-stone-100">
        <div className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-950">{formatDayHeader(selectedDay)}</h3>
            <button
              onClick={() => { onCrear(); onClose() }}
              className="rounded-xl bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-700 active:scale-95"
            >
              + Agregar
            </button>
          </div>

          {loadingDay ? (
            <div className="flex justify-center py-8">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-stone-500" />
            </div>
          ) : (
            <div className="space-y-1.5">
              {dayEvents.map((ev) => (
                <EventRow key={ev.id} event={ev} onTap={(e) => { onEventTap?.(e); onClose() }} />
              ))}
              {dayTasks.map((t) => (
                <TaskRowCal key={t.id} task={t} onTap={(tk) => { onTaskTap?.(tk); onClose() }} />
              ))}
              {dayEvents.length === 0 && dayTasks.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm text-stone-400">Sin actividades este día</p>
                  <p className="mt-0.5 text-xs text-stone-300">Toca "+ Agregar" para agendar algo</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="pb-safe" />
      </div>
    </div>
  )
}
