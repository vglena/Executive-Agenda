'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, clearToken } from '@/lib/api/client'
import { AgendaDelDia } from '@/components/dashboard/AgendaDelDia'
import { TareasPendientes } from '@/components/dashboard/TareasPendientes'
import { ProximosDias } from '@/components/dashboard/ProximosDias'
import { BriefEjecutivo } from '@/components/dashboard/BriefEjecutivo'
import { CrearModal } from '@/components/dashboard/CrearModal'
import { DetalleModal, DetalleItem } from '@/components/dashboard/DetalleModal'
import { AppHeader } from '@/components/ui/AppHeader'

export default function DashboardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [crearOpen, setCrearOpen] = useState(false)
  const [detalleItem, setDetalleItem] = useState<DetalleItem | null>(null)

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
        const { creados = 0, actualizados = 0 } = data
        setSyncMsg(
          creados + actualizados === 0
            ? 'Google Calendar sincronizado — sin cambios.'
            : `Agenda actualizada: ${creados} nuevo(s), ${actualizados} actualizado(s).`,
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
      <AppHeader
        title="Mi agenda"
        showSync={googleConnected}
        syncing={syncing}
        onSync={handleSyncGoogle}
        showSignOut
        onSignOut={handleLogout}
        syncMessage={syncMsg}
        onCrear={() => setCrearOpen(true)}
      />

      <main className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Brief ejecutivo: 2–3 frases sobre el día */}
        <BriefEjecutivo refreshKey={refreshKey} />

        {/* Agenda unificada: timeline + pendientes + próximos días como un flujo continuo */}
        <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100 divide-y divide-stone-100">
          {/* Centro de la app: línea temporal viva del día */}
          <AgendaDelDia
            refreshKey={refreshKey}
            onEventTap={(ev) => setDetalleItem({ type: 'event', data: ev })}
          />

          {/* Tareas y pendientes */}
          <TareasPendientes
            refreshKey={refreshKey}
            onTaskTap={(task) => setDetalleItem({ type: 'task', data: task })}
          />

          {/* Próximos días — continuación natural */}
          <ProximosDias
            refreshKey={refreshKey}
            onEventTap={(ev) => setDetalleItem({ type: 'event', data: ev })}
          />
        </div>
      </main>

      {/* Modal de creación */}
      <CrearModal
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreated={handleCreated}
      />

      {/* Modal de detalle */}
      <DetalleModal
        item={detalleItem}
        onClose={() => setDetalleItem(null)}
        onUpdated={() => { setDetalleItem(null); setRefreshKey((k) => k + 1) }}
      />
    </div>
  )
}

