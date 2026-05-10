'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { PriorityTask } from '@/lib/types/api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelativeDate, formatTaskDeadline } from '@/lib/utils/display-time'

interface PrioritiesResponse {
  fecha: string
  tareas: PriorityTask[]
  mensaje?: string
}

export function TopPrioridades({
  refreshKey = 0,
  limit = 5,
}: {
  refreshKey?: number
  limit?: number
}) {
  const [tareas, setTareas] = useState<PriorityTask[]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiFetch<PrioritiesResponse>('/api/priorities/today')
      .then((data) => {
        setTareas(data.tareas.slice(0, limit))
        if (data.mensaje) setMensaje(data.mensaje)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [refreshKey, limit])

  return (
    <Card
      title={limit <= 3 ? 'Lo próximo' : 'Tareas destacadas'}
      description={limit <= 3 ? 'Tareas que se acercan o requieren atención.' : undefined}
    >
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && tareas.length === 0 && (
        <EmptyState
          title={mensaje ?? 'Sin tareas destacadas.'}
          description="Cuando se acerquen tareas importantes, aparecerán aquí."
        />
      )}
      {!loading && !error && tareas.length > 0 && (
        <ol className="space-y-0 divide-y divide-stone-100">
          {tareas.map((t) => (
            <li key={t.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-stone-950">{t.titulo}</p>
                {t.justificacion && (
                  <p className="mt-0.5 text-xs leading-snug text-stone-400">{t.justificacion}</p>
                )}
                {t.fecha_limite ? (
                  <p className="mt-1 text-xs text-stone-400">
                    <span className="font-medium text-stone-500">{formatRelativeDate(t.fecha_limite)}</span>
                    {' · '}
                    <span className="sm:hidden">{formatTaskDeadline(t.fecha_limite, 'compact')}</span>
                    <span className="hidden sm:inline">{formatTaskDeadline(t.fecha_limite, 'long')}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-stone-400">Sin fecha</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
