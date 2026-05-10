'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Task } from '@/lib/types/api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelativeDate } from '@/lib/utils/display-time'

// ─── Slot classification ──────────────────────────────────────────────────────

type Slot = 'vencida' | 'hoy' | 'semana' | 'despues'

function getSlot(fechaLimite: string | null): Slot {
  if (!fechaLimite) return 'despues'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = fechaLimite.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return 'vencida'
  if (diffDays === 0) return 'hoy'
  if (diffDays <= 7) return 'semana'
  return 'despues'
}

// ─── Impact label ─────────────────────────────────────────────────────────────

function impactLabel(prioridad: Task['prioridad_manual']): string | null {
  if (prioridad === 'P1') return 'Urgente'
  if (prioridad === 'P2') return 'Importante'
  return null
}

// ─── Complete button ──────────────────────────────────────────────────────────

function CompleteButton({
  onComplete,
  completing,
  slot,
}: {
  onComplete: () => void
  completing: boolean
  slot: Slot
}) {
  const ringColor =
    slot === 'vencida'
      ? 'border-rose-300 hover:border-rose-500'
      : slot === 'hoy'
        ? 'border-blue-300 hover:border-blue-500'
        : 'border-stone-300 hover:border-stone-500'

  return (
    <button
      onClick={onComplete}
      disabled={completing}
      aria-label="Marcar como completada"
      className="tap-target -ml-2 flex shrink-0 items-center justify-center px-2"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-150 ${
          completing ? 'border-stone-200 bg-stone-100' : ringColor
        }`}
      >
        {completing && (
          <svg
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2.5 w-2.5 text-stone-400"
            aria-hidden
          >
            <path d="M1.5 5.5l2 2 4-4" />
          </svg>
        )}
      </span>
    </button>
  )
}

// ─── Single task row ──────────────────────────────────────────────────────────

function TaskRow({
  task,
  slot,
  onComplete,
}: {
  task: Task
  slot: Slot
  onComplete: (id: string) => void
}) {
  const [completing, setCompleting] = useState(false)

  async function handleComplete() {
    setCompleting(true)
    onComplete(task.id) // optimistic remove
    try {
      await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'completada' }),
      })
    } catch {
      // silently fail — task already removed from view; user can refresh if needed
    }
  }

  const impact = impactLabel(task.prioridad_manual)
  const titleColor =
    slot === 'vencida'
      ? 'text-rose-800 font-semibold'
      : slot === 'hoy'
        ? 'text-stone-950 font-medium'
        : slot === 'semana'
          ? 'text-stone-800'
          : 'text-stone-500'

  return (
    <li className="flex items-center gap-0 py-2 first:pt-0 last:pb-0">
      <CompleteButton onComplete={handleComplete} completing={completing} slot={slot} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${titleColor}`}>{task.titulo}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className={`text-xs tabular-nums ${
              slot === 'vencida'
                ? 'font-medium text-rose-500'
                : slot === 'hoy'
                  ? 'text-blue-500'
                  : 'text-stone-400'
            }`}
          >
            {formatRelativeDate(task.fecha_limite)}
          </span>
          {impact && (
            <span
              className={`rounded-full px-1.5 py-px text-[10px] font-semibold leading-none ${
                impact === 'Urgente'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              {impact}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

// ─── Group block ──────────────────────────────────────────────────────────────

const GROUP_META: Record<Slot, { label: string; hint: string }> = {
  vencida: { label: 'Requiere acción', hint: 'Bloqueando el día' },
  hoy:     { label: 'Para hoy',       hint: 'Deadline hoy' },
  semana:  { label: 'Esta semana',    hint: 'Próximos 7 días' },
  despues: { label: 'Después',        hint: 'Puede ignorarse ahora' },
}

const GROUP_ORDER: Slot[] = ['vencida', 'hoy', 'semana', 'despues']

function TaskGroup({
  slot,
  tasks,
  onComplete,
  defaultCollapsed,
}: {
  slot: Slot
  tasks: Task[]
  onComplete: (id: string) => void
  defaultCollapsed: boolean
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const meta = GROUP_META[slot]

  const accentLabel =
    slot === 'vencida'
      ? 'text-rose-600'
      : slot === 'hoy'
        ? 'text-blue-600'
        : 'text-stone-400'

  return (
    <div>
      {/* Group header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between py-2 text-left"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${accentLabel}`}>
            {meta.label}
          </span>
          <span className="text-[11px] text-stone-300">·</span>
          <span className="text-[11px] text-stone-400">{meta.hint}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-stone-400">{tasks.length}</span>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3 w-3 text-stone-300 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      </button>

      {/* Task list */}
      {!collapsed && (
        <ul className="divide-y divide-stone-100 pb-1">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} slot={slot} onComplete={onComplete} />
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TareasPendientes({ refreshKey = 0 }: { refreshKey?: number }) {
  const [tareas, setTareas] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente')
      .then((data) => setTareas(data.tareas))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar, refreshKey])

  // Optimistic complete — remove from local list immediately
  const handleComplete = useCallback((id: string) => {
    setTareas((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Group tasks
  const groups = GROUP_ORDER.map((slot) => ({
    slot,
    tasks: tareas.filter((t) => getSlot(t.fecha_limite) === slot),
  })).filter((g) => g.tasks.length > 0)

  const totalBloqueando = tareas.filter((t) => getSlot(t.fecha_limite) === 'vencida').length

  return (
    <Card
      title="Operativo"
      description={
        totalBloqueando > 0
          ? `${totalBloqueando} ${totalBloqueando === 1 ? 'tarea bloquea' : 'tareas bloquean'} el día`
          : 'Pendientes abiertos'
      }
    >
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && tareas.length === 0 && (
        <EmptyState
          title="Sin pendientes abiertos."
          description="No hay cola operativa fuera del foco actual."
        />
      )}
      {!loading && !error && groups.length > 0 && (
        <div className="divide-y divide-stone-100">
          {groups.map((g, i) => (
            <TaskGroup
              key={g.slot}
              slot={g.slot}
              tasks={g.tasks}
              onComplete={handleComplete}
              // Collapse "Después" by default; keep everything else open
              defaultCollapsed={g.slot === 'despues' && i > 0}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
