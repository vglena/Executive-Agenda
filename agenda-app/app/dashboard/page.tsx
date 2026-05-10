'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, clearToken } from '@/lib/api/client'
import { AgendaDelDia } from '@/components/dashboard/AgendaDelDia'
import { TopPrioridades } from '@/components/dashboard/TopPrioridades'
import { TareasPendientes } from '@/components/dashboard/TareasPendientes'
import { RecordatoriosProximos } from '@/components/dashboard/RecordatoriosProximos'
import { ResumenDiario } from '@/components/dashboard/ResumenDiario'
import { QuickAddPanel } from '@/components/quickadd/QuickAddPanel'
import { ConflictosCalendario } from '@/components/dashboard/ConflictosCalendario'
import { ExecutiveBrief } from '@/components/dashboard/ExecutiveBrief'
import { AppHeader } from '@/components/ui/AppHeader'
import { BottomNav } from '@/components/ui/BottomNav'

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
    <div className="min-h-screen executive-shell pb-16 sm:pb-0">
      <AppHeader
        showSync={googleConnected}
        syncing={syncing}
        onSync={handleSyncGoogle}
        showFoco
        showSignOut
        onSignOut={handleLogout}
        syncMessage={syncMsg}
      />

      <main className="mx-auto max-w-6xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-6 sm:py-6">
        <ExecutiveBrief refreshKey={refreshKey} googleConnected={googleConnected} />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <TopPrioridades refreshKey={refreshKey} limit={3} />
          <AgendaDelDia refreshKey={refreshKey} />
        </div>

        <div id="quickadd" className="scroll-mt-16">
          <QuickAddPanel onCreated={handleCreated} />
        </div>

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

      <BottomNav />
    </div>
  )
}
