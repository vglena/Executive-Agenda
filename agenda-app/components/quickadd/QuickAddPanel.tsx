'use client'

import { useState } from 'react'
import { SmartCapture } from './SmartCapture'
import { QuickAddTask } from './QuickAddTask'
import { QuickAddEvent } from './QuickAddEvent'
import { QuickAddReminder } from './QuickAddReminder'

type FormType = 'tarea' | 'evento' | 'recordatorio'

interface QuickAddPanelProps {
  /** Se llama cada vez que se crea un item; el dashboard hace refresh */
  onCreated: () => void
}

export function QuickAddPanel({ onCreated }: QuickAddPanelProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<FormType>('tarea')
  const [detailSuccess, setDetailSuccess] = useState<string | null>(null)

  function handleSmartCreated() {
    onCreated()
  }

  function handleDetailCreated(tipo: FormType) {
    const labels: Record<FormType, string> = {
      tarea: 'Tarea guardada.',
      evento: 'Evento añadido a la agenda.',
      recordatorio: 'Recordatorio programado.',
    }
    setDetailSuccess(labels[tipo])
    setTimeout(() => setDetailSuccess(null), 3000)
    onCreated()
  }

  const TABS: { id: FormType; label: string }[] = [
    { id: 'tarea', label: 'Tarea' },
    { id: 'evento', label: 'Evento' },
    { id: 'recordatorio', label: 'Recordatorio' },
  ]

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80">
      {/* Smart capture — primary UI */}
      <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <p className="mb-2 text-xs font-medium text-stone-500">Captura rápida</p>
        <SmartCapture onCreated={handleSmartCreated} />
      </div>

      {/* Detailed form — collapsible */}
      <div className="border-t border-stone-100">
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-xs font-medium text-stone-400 transition hover:bg-stone-50 hover:text-stone-600 sm:px-5"
        >
          <span>Formulario detallado</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${detailOpen ? 'rotate-180' : ''}`}
            aria-hidden
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {detailOpen && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            {/* Tabs */}
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`tap-target whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-stone-950 text-white shadow-sm'
                      : 'bg-white/80 text-stone-600 ring-1 ring-inset ring-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="min-h-[160px]">
              {activeTab === 'tarea' && (
                <QuickAddTask onCreated={() => handleDetailCreated('tarea')} />
              )}
              {activeTab === 'evento' && (
                <QuickAddEvent onCreated={() => handleDetailCreated('evento')} />
              )}
              {activeTab === 'recordatorio' && (
                <QuickAddReminder onCreated={() => handleDetailCreated('recordatorio')} />
              )}
            </div>

            {/* Detail success */}
            {detailSuccess && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
                {detailSuccess}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
