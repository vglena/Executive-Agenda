'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, clearToken, getToken } from '@/lib/api/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Spinner } from '@/components/ui/Spinner'
import { AppHeader } from '@/components/ui/AppHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import type { DailySummary, PriorityTask } from '@/lib/types/api'
import { formatDateTime, formatRelativeDate, formatTaskDeadline } from '@/lib/utils/display-time'
import { sanitizeLLMText } from '@/lib/security/sanitize'

interface PrioritiesResponse {
  fecha: string
  generado_en: string | null
  recalculado_en: string | null
  tareas: PriorityTask[]
  mensaje?: string
}

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
  if (!data) return 'Calculando señales del día'
  const generated = data.recalculado_en ?? data.generado_en
  return generated
    ? `Actualizado ${formatDateTime(generated, { style: 'compact' })}`
    : 'Pendiente de cálculo'
}

function attentionLevel(task: PriorityTask): 'urgent' | 'soon' | 'watch' {
  if (!task.fecha_limite) return task.score >= 5 ? 'watch' : 'soon'
  const rel = formatRelativeDate(task.fecha_limite)
  if (rel.startsWith('Hace') || rel === 'Hoy') return 'urgent'
  if (rel === 'Mañana' || rel.startsWith('En 2') || rel.startsWith('En 3')) return 'soon'
  return 'watch'
}

function signalLabel(task: PriorityTask): string {
  if (!task.fecha_limite) return 'sin fecha · sin hora'
  const rel = formatRelativeDate(task.fecha_limite)
  if (rel.startsWith('Hace')) return 'atrasado'
  if (rel === 'Hoy') return 'vence hoy'
  if (rel === 'Mañana') return 'vence mañana'
  return 'próximo'
}

function whenLabel(task: PriorityTask): string {
  if (!task.fecha_limite) return 'Sin fecha · sin hora'
  return `${formatRelativeDate(task.fecha_limite)} · ${formatTaskDeadline(task.fecha_limite, 'compact')}`
}

function FocusCard({
  task,
  emphasis = 'normal',
}: {
  task: PriorityTask
  emphasis?: 'hero' | 'normal' | 'quiet'
}) {
  const level = attentionLevel(task)
  const tone = level === 'urgent'
    ? 'bg-rose-50 text-rose-700 ring-rose-200'
    : level === 'soon'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : 'bg-blue-50 text-blue-700 ring-blue-200'

  return (
    <article className={`rounded-2xl bg-white ring-1 ring-stone-200 ${
      emphasis === 'hero' ? 'p-5 shadow-[0_18px_45px_rgba(31,41,55,0.10)]' : 'p-4'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tone}`}>
            {signalLabel(task)}
          </span>
          <h3 className={`mt-3 font-semibold text-stone-950 ${
            emphasis === 'hero' ? 'text-xl leading-snug' : 'text-base'
          }`}>
            {task.titulo}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
          #{task.posicion}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        {sanitizeLLMText(task.justificacion) || 'La app lo destaca por señales operativas del día.'}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="rounded-full bg-stone-100 px-2.5 py-1 tabular-nums">
          {whenLabel(task)}
        </span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1">
          atención {Math.round(task.score * 10) / 10}
        </span>
      </div>
    </article>
  )
}

function FocusSection() {
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
      setError(e instanceof Error ? e.message : 'Error al cargar el foco de hoy.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRecalculate() {
    setRecalculating(true)
    setError(null)
    try {
      await apiFetch('/api/priorities/recalculate', { method: 'POST' })
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al recalcular.')
    } finally {
      setRecalculating(false)
    }
  }

  const nowTask = data?.tareas[0] ?? null
  const nextTasks = useMemo(() => data?.tareas.slice(1, 4) ?? [], [data])
  const laterTasks = useMemo(() => data?.tareas.slice(4) ?? [], [data])

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-stone-950 text-white shadow-[0_24px_70px_rgba(28,25,23,0.22)]">
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-stone-300">{formatFechaHoy()}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">Foco de hoy</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-200">
                Qué requiere atención ahora, qué viene después y qué puede esperar.
              </p>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={loading || recalculating}
              className="tap-target shrink-0 rounded-full bg-white/10 px-4 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-50"
            >
              {recalculating ? 'Recalculando...' : 'Recalcular'}
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
      {!loading && !error && data && data.tareas.length === 0 && (
        <EmptyState
          title={data.mensaje ?? 'Nada requiere atención ahora.'}
          description="No hay señales operativas fuertes. Puedes usar este espacio para trabajo profundo o revisión ligera."
        />
      )}

      {!loading && !error && nowTask && (
        <>
          <section className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase text-stone-500">Ahora</p>
            <FocusCard task={nowTask} emphasis="hero" />
          </section>

          {nextTasks.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase text-stone-500">Después</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {nextTasks.map((task) => (
                  <FocusCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-stone-950">Más adelante</h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Puede esperar mientras resuelves el foco principal.
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">
                {laterTasks.length}
              </span>
            </div>
            {laterTasks.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">No hay más elementos destacados por ahora.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {laterTasks.map((task) => (
                  <li key={task.id} className="flex items-start justify-between gap-3 border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium text-stone-800">{task.titulo}</p>
                      <p className="mt-0.5 text-xs text-stone-400">{whenLabel(task)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-500">
                      {signalLabel(task)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  )
}

function DailySummarySection() {
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
      setError(e instanceof Error ? e.message : 'Error al cargar briefing.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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
          <h2 className="text-base font-semibold text-stone-950">Briefing accionable</h2>
          {data?.generated_at && (
            <p className="mt-0.5 text-xs text-stone-400">
              Generado {formatDateTime(data.generated_at, { style: 'compact' })}
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
            title="Sin briefing disponible."
            description="El asistente mostrará aquí el contexto del día cuando esté generado."
          />
        )}
        {!loading && !error && data && (
          <div className="space-y-5">
            {data.sugerencia_del_dia && (
              <div className="rounded-xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                <p className="text-xs font-semibold uppercase text-blue-700">Sugerencia del asistente</p>
                <p className="mt-1 text-sm leading-relaxed text-blue-950">{sanitizeLLMText(data.sugerencia_del_dia)}</p>
              </div>
            )}

            <div className="space-y-3 text-sm leading-relaxed text-stone-700">
              {sanitizeLLMText(data.contenido_completo).split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return (
                    <h3 key={i} className="pt-1 font-semibold text-stone-950">
                      {line.replace(/^## /, '')}
                    </h3>
                  )
                }
                if (line.trim() === '') return null
                return <p key={i}>{line}</p>
              })}
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-stone-100 pt-4">
              <div>
                <p className="text-lg font-semibold text-stone-950">{data.eventos_del_dia.length}</p>
                <p className="text-xs text-stone-400">eventos</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-950">{data.tareas_vencidas.length}</p>
                <p className="text-xs text-stone-400">atrasadas</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-950">{data.tareas_prioritarias.length}</p>
                <p className="text-xs text-stone-400">en foco</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default function PrioritiesPage() {
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
        title="Foco"
        backHref="/dashboard"
        backLabel="Dashboard"
        showSignOut
        onSignOut={handleLogout}
      />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        <FocusSection />
        <DailySummarySection />
      </main>

      <BottomNav />
    </div>
  )
}
