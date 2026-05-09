'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Task } from '@/lib/types/api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatTaskDeadline } from '@/lib/utils/display-time'

function isOverdue(fechaLimite: string | null): boolean {
  if (!fechaLimite) return false
  const today = new Date().toISOString().split('T')[0]
  return fechaLimite < today
}

export function TareasPendientes({ refreshKey = 0 }: { refreshKey?: number }) {
  const [tareas, setTareas] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiFetch<{ tareas: Task[] }>('/api/tasks?estado=pendiente')
      .then((data) => setTareas(data.tareas.slice(0, 8)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [refreshKey])

  return (
    <Card title="Operativo" description="Pendientes abiertos para revisar luego.">
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && tareas.length === 0 && (
        <EmptyState
          title="Sin pendientes abiertos."
          description="No hay cola operativa fuera del foco actual."
        />
      )}
      {!loading && !error && tareas.length > 0 && (
        <ul className="space-y-2">
          {tareas.map((t) => {
            const overdue = isOverdue(t.fecha_limite)
            return (
              <li key={t.id} className="flex items-start gap-2 rounded-lg px-1 py-1">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-stone-300" title="Tarea" />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      overdue ? 'font-semibold text-rose-700' : 'text-stone-800'
                    }`}
                  >
                    {t.titulo}
                  </p>
                  <p
                    className={`mt-0.5 text-xs tabular-nums ${
                      overdue ? 'font-medium text-rose-600' : 'text-stone-400'
                    }`}
                  >
                    {t.fecha_limite ? (
                      <>
                        <span className="sm:hidden">{formatTaskDeadline(t.fecha_limite, 'compact')}</span>
                        <span className="hidden sm:inline">{formatTaskDeadline(t.fecha_limite, 'long')}</span>
                      </>
                    ) : (
                      'Sin fecha · sin hora'
                    )}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
