'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, clearToken, getToken } from '@/lib/api/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Spinner } from '@/components/ui/Spinner'
import { AppHeader } from '@/components/ui/AppHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import type { DailySummary, PriorityTask } from '@/lib/types/api'
import { formatDateTime, formatRelativeDate } from '@/lib/utils/display-time'
import { sanitizeLLMText } from '@/lib/security/sanitize'

interface PrioritiesResponse {
  fecha: string
  generado_en: string | null
  recalculado_en: string | null
  tareas: PriorityTask[]
  mensaje?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFechaHoy(): string {
  const raw = new Date().toLocaleDateString('es', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const lowered = raw.toLowerCase()
  return lowered.charAt(0).toUpperCase() + lowered.slice(1)
}

function formatMeta(data: PrioritiesResponse | null): string {
  if (!data) return 'Preparando tu día'
  const generated = data.recalculado_en ?? data.generado_en
  return generated
    ? `Actualizado ${formatDateTime(generated, { style: 'compact' })}`
    : 'Pendiente de cálculo'
}

type TemporalSlot = 'hoy' | 'manana' | 'semana' | 'despues'

function getTemporalSlot(task: PriorityTask): TemporalSlot | 'pasado' {
  if (!task.fecha_limite) return 'despues'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = task.fecha_limite.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return 'pasado'
  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'manana'
  if (diffDays <= 7) return 'semana'
  return 'despues'
}

function slotLabel(slot: TemporalSlot): string {
  const labels: Record<TemporalSlot, string> = {
    hoy: 'Hoy',
    manana: 'Mañana',
    semana: 'Esta semana',
    despues: 'Más adelante',
  }
  return labels[slot]
}

function chipTone(slot: TemporalSlot): string {
  if (slot === 'hoy') return 'bg-blue-50 text-blue-700 ring-blue-200'
  if (slot === 'manana') return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-stone-100 text-stone-600 ring-stone-200'
}

function dateLabel(task: PriorityTask): string {
  if (!task.fecha_limite) return 'Sin fecha'
  return formatRelativeDate(task.fecha_limite)
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  emphasis = 'normal',
}: {
  task: PriorityTask
  emphasis?: 'hero' | 'normal'
}) {
  const slot = getTemporalSlot(task)
  if (slot === 'pasado') return null

  const tone = chipTone(slot)
  const label = slotLabel(slot)

  return (
    <article
      className={`rounded-2xl bg-white ring-1 ring-stone-200 ${
        emphasis === 'hero' ? 'p-5 shadow-[0_18px_45px_rgba(31,41,55,0.10)]' : 'p-4'
      }`}
    >
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tone}`}
      >
        {label}
      </span>

      <h3
        className={`mt-3 font-semibold text-stone-950 ${
          emphasis === 'hero' ? 'text-xl leading-snug' : 'text-base leading-snug'
        }`}
      >
        {task.titulo}
      </h3>

      {task.justificacion && (
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {sanitizeLLMText(task.justificacion)}
        </p>
      )}

      <p className="mt-3 text-xs text-stone-400">{dateLabel(task)}</p>
    </article>
  )
}

// ─── MiDiaSection ─────────────────────────────────────────────────────────────

const SLOT_ORDER: TemporalSlot[] = ['hoy', 'manana', 'semana', 'despues']

function MiDiaSection() {
  const [data, setData] = useState<PrioritiesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recalculating, setRecalculating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await apiFetch<PrioritiesResponse>('/api/priorities/today')
      setData(d)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar el día.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRecalculate() {
    setRecalculating(true)
    setError(null)
    try {
      await apiFetch('/api/priorities/recalculate', { method: 'POST' })
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al actualizar.')
    } finally {
      setRecalculating(false)
    }
  }

  // Filter past tasks, sort by fecha_limite ascending (null last)
  const activeTasks = (data?.tareas ?? []).filter((t) => getTemporalSlot(t) !== 'pasado')
  const sorted = [...activeTasks].sort((a, b) => {
    if (!a.fecha_limite && !b.fecha_limite) return 0
    if (!a.fecha_limite) return 1
    if (!b.fecha_limite) return -1
    return a.fecha_limite.localeCompare(b.fecha_limite)
  })

  const grouped = SLOT_ORDER.map((slot) => ({
    slot,
    tasks: sorted.filter((t) => getTemporalSlot(t) === slot),
  })).filter((g) => g.tasks.length > 0)

  const heroTask = grouped[0]?.tasks[0] ?? null

  return (
    <section className="space-y-4">
      {/* Dark hero card */}
      <div className="overflow-hidden rounded-3xl bg-stone-950 text-white shadow-[0_24px_70px_rgba(28,25,23,0.22)]">
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-stone-300">{formatFechaHoy()}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">Mi día</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-200">
                Lo que tienes pendiente hoy y lo que se acerca.
              </p>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={loading || recalculating}
              className="tap-target shrink-0 rounded-full bg-white/10 px-4 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-50"
            >
              {recalculating ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
          <p className="mt-5 text-xs text-stone-400">{formatMeta(data)}</p>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl bg-white p-8 ring-1 ring-stone-200">
          <Spinner />
        </div>
      )}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && grouped.length === 0 && (
        <EmptyState
          title={data?.mensaje ?? 'Sin pendientes próximos.'}
          description="No tienes tareas con fecha próxima. Puedes capturar una nueva desde Añadir."
        />
      )}

      {!loading && !error && heroTask && (
        <>
          {/* Hero task */}
          <section className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
              {slotLabel(getTemporalSlot(heroTask) as TemporalSlot)}
            </p>
            <TaskCard task={heroTask} emphasis="hero" />
          </section>

          {/* Remaining groups */}
          {grouped.map((group, gi) => {
            const tasks = gi === 0 ? group.tasks.slice(1) : group.tasks
            if (tasks.length === 0) return null
            return (
              <section key={group.slot} className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {slotLabel(group.slot)}
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )
          })}
        </>
      )}
    </section>
  )
}

// ─── ResumenDelDia ─────────────────────────────────────────────────────────────

function ResumenDelDia() {
  const [data, setData] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await apiFetch<DailySummary>('/api/daily-summary')
      setData(d)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar el resumen.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRegenerate() {
    setRegenerating(true)
    setError(null)
    try {
      const d = await apiFetch<DailySummary>('/api/daily-summary/regenerate', { method: 'POST' })
      setData(d)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al regenerar.')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-stone-950">Resumen del día</h2>
          {data?.generated_at && (
            <p className="mt-0.5 text-xs text-stone-400">
              Actualizado {formatDateTime(data.generated_at, { style: 'compact' })}
            </p>
          )}
        </div>
        <button
          onClick={handleRegenerate}
          disabled={loading || regenerating}
          className="tap-target rounded-full bg-stone-100 px-4 text-xs font-semibold text-stone-600 transition hover:bg-stone-200 disabled:opacity-50"
        >
          {regenerating ? 'Generando...' : 'Regenerar'}
        </button>
      </div>

      <div className="mt-4">
        {loading && <Spinner />}
        {error && <ErrorMessage message={error} />}
        {!loading && !error && !data && (
          <EmptyState
            title="Sin resumen disponible."
            description="El asistente mostrará aquí el contexto del día cuando esté generado."
          />
        )}
        {!loading && !error && data && (
          <div className="space-y-5">
            {data.sugerencia_del_dia && (
              <div className="rounded-xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                <p className="text-xs font-semibold uppercase text-blue-700">
                  Sugerencia del asistente
                </p>
                <p className="mt-1 text-sm leading-relaxed text-blue-950">
                  {sanitizeLLMText(data.sugerencia_del_dia)}
                </p>
              </div>
            )}
            <div className="space-y-3 text-sm leading-relaxed text-stone-700">
              {sanitizeLLMText(data.contenido_completo)
                .split('\n')
                .map((line, i) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h3 key={i} className="pt-1 font-semibold text-stone-950">
                        {line.replace(/^## /, '')}
                      </h3>
                    )
                  }
                  if (line.trim() === '') return null
                  return (
                    <p key={i} className="text-stone-700">
                      {line}
                    </p>
                  )
                })}
            </div>
            <p className="text-xs text-stone-300">
              Actualizado {formatDateTime(data.generated_at, { style: 'compact' })}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MiDiaPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [router])

  function handleLogout() {
    clearToken()
    router.replace('/login')
  }

  if (!ready) return null

  return (
    <div className="min-h-screen executive-shell pb-16 sm:pb-0">
      <AppHeader
        title="Mi día"
        backHref="/dashboard"
        backLabel="Hoy"
        showSignOut
        onSignOut={handleLogout}
      />

      <main className="mx-auto max-w-3xl space-y-4 px-3 py-3 sm:px-6 sm:py-6">
        <MiDiaSection />
        <ResumenDelDia />
      </main>

      <BottomNav />
    </div>
  )
}

