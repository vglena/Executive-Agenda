'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getToken, clearToken } from '@/lib/api/client'
import { AgendaDelDia } from '@/components/dashboard/AgendaDelDia'
import { TopPrioridades } from '@/components/dashboard/TopPrioridades'
import { TareasPendientes } from '@/components/dashboard/TareasPendientes'
import { RecordatoriosProximos } from '@/components/dashboard/RecordatoriosProximos'
import { ResumenDiario } from '@/components/dashboard/ResumenDiario'
import { QuickAddPanel } from '@/components/quickadd/QuickAddPanel'
import { ConflictosCalendario } from '@/components/dashboard/ConflictosCalendario'
import { ExecutiveBrief } from '@/components/dashboard/ExecutiveBrief'

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

export default function DashboardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
    } else {
      setReady(true)
      fetch('/api/calendar/status', {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then((r) => r.json())
        .then((data: { connected?: boolean }) => setGoogleConnected(data.connected === true))
        .catch(() => {/* Google es opcional */})
    }
  }, [router])

  function handleLogout() {
    clearToken()
    router.replace('/login')
  }

  function handleCreated() {
    setRefreshKey((k) => k + 1)
  }

  async function handleSyncGoogle() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json() as {
        ok: boolean
        creados?: number
        actualizados?: number
        conflictos_detectados?: number
        error?: string
      }
      if (data.ok) {
        const { creados = 0, actualizados = 0, conflictos_detectados = 0 } = data
        setSyncMsg(
          creados + actualizados === 0
            ? 'Google Calendar sincronizado - sin cambios.'
            : `Agenda actualizada: ${creados} nuevo(s), ${actualizados} actualizado(s)${conflictos_detectados > 0 ? `, ${conflictos_detectados} conflicto(s)` : ''}.`
        )
        setRefreshKey((k) => k + 1)
      } else {
        setSyncMsg(data.error ?? 'Error al sincronizar.')
      }
    } catch {
      setSyncMsg('Error de red al sincronizar.')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 5000)
    }
  }

  if (!ready) return null

  return (
    <div className="min-h-screen executive-shell">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-stone-950">Hoy</h1>
            <p className="mt-0.5 truncate text-xs capitalize text-stone-500">{formatFechaHoy()}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto">
            {googleConnected && (
              <button
                onClick={handleSyncGoogle}
                disabled={syncing}
                className="tap-target whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-50"
              >
                {syncing ? 'Actualizando...' : 'Sync'}
              </button>
            )}
            <Link
              href="/priorities"
              className="tap-target whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
            >
              Foco
            </Link>
            <button
              onClick={handleLogout}
              className="tap-target whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
            >
              Salir
            </button>
          </div>
        </div>
        {syncMsg && (
          <div className="border-t border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-700 sm:px-6">
            {syncMsg}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-6 sm:py-6">
        <ExecutiveBrief refreshKey={refreshKey} googleConnected={googleConnected} />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <TopPrioridades refreshKey={refreshKey} limit={3} />
          <AgendaDelDia refreshKey={refreshKey} />
        </div>

        <QuickAddPanel onCreated={handleCreated} />

        {googleConnected && (
          <ConflictosCalendario
            refreshKey={refreshKey}
            onResolved={() => setRefreshKey((k) => k + 1)}
          />
        )}

        <ResumenDiario />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <TareasPendientes refreshKey={refreshKey} />
          <RecordatoriosProximos refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  )
}
