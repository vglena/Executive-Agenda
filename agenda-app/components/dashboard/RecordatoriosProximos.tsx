'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Reminder } from '@/lib/types/api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/lib/utils/display-time'

export function RecordatoriosProximos({ refreshKey = 0 }: { refreshKey?: number }) {
  const [recordatorios, setRecordatorios] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiFetch<{ recordatorios: Reminder[] }>('/api/reminders?estado=activo')
      .then((data) => setRecordatorios(data.recordatorios.slice(0, 5)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [refreshKey])

  return (
    <Card title="Señales próximas" description="Recordatorios activos que pueden interrumpir.">
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && recordatorios.length === 0 && (
        <EmptyState
          title="Sin señales programadas."
          description="No hay recordatorios activos que requieran atención."
        />
      )}
      {!loading && !error && recordatorios.length > 0 && (
        <ul className="space-y-3">
          {recordatorios.map((r) => (
            <li key={r.id} className="flex items-start gap-3 rounded-lg px-1 py-1">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Recordatorio" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-800">
                  {r.mensaje ??
                    (r.entidad_tipo === 'tarea'
                      ? 'Recordatorio de tarea'
                      : 'Recordatorio de evento')}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-stone-400">
                  <span className="sm:hidden">{formatDateTime(r.fecha_hora_disparo, { style: 'compact' })}</span>
                  <span className="hidden sm:inline">{formatDateTime(r.fecha_hora_disparo, { style: 'long' })}</span>
                  {' · '}
                  {r.antelacion_tipo}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
