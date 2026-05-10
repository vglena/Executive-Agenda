'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { DailySummary } from '@/lib/types/api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/lib/utils/display-time'
import { sanitizeLLMText } from '@/lib/security/sanitize'

export function ResumenDiario() {
  const [resumen, setResumen] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<DailySummary>('/api/daily-summary')
      .then(setResumen)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card title="Briefing completo" description="Detalle del asistente para revisar con calma.">
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && !resumen && (
        <EmptyState
          title="Sin briefing disponible."
          description="El asistente lo mostrará aquí cuando esté generado."
        />
      )}
      {!loading && !error && resumen && (
        <div className="space-y-4">
          {resumen.sugerencia_del_dia && (
            <div className="rounded-xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
              <p className="text-xs font-semibold uppercase text-blue-700">Sugerencia del asistente</p>
              <p className="mt-1 text-sm leading-relaxed text-blue-950">
                {sanitizeLLMText(resumen.sugerencia_del_dia)}
              </p>
            </div>
          )}
          <div className="space-y-3 text-sm leading-relaxed text-stone-700">
            {sanitizeLLMText(resumen.contenido_completo).split('\n').map((line, i) => {
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
            Actualizado {formatDateTime(resumen.generated_at, { style: 'compact' })}
          </p>
        </div>
      )}
    </Card>
  )
}
