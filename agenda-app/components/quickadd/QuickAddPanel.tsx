'use client'

import { useState } from 'react'
import { QuickAddTask } from './QuickAddTask'
import { QuickAddEvent } from './QuickAddEvent'
import { QuickAddReminder } from './QuickAddReminder'

type FormType = 'tarea' | 'evento' | 'recordatorio'

const TABS: { id: FormType; label: string; hint: string }[] = [
  { id: 'tarea', label: 'Tarea', hint: 'Algo que hacer o completar' },
  { id: 'evento', label: 'Evento', hint: 'Una reunión o compromiso con hora' },
  { id: 'recordatorio', label: 'Recordatorio', hint: 'Una alerta antes de algo importante' },
]

interface QuickAddPanelProps {
  /** Se llama cada vez que se crea un item; el dashboard hace refresh */
  onCreated: () => void
}

export function QuickAddPanel({ onCreated }: QuickAddPanelProps) {
  const [active, setActive] = useState<FormType>('tarea')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function handleCreated(tipo: FormType) {
    const labels: Record<FormType, string> = {
      tarea: 'Tarea capturada.',
      evento: 'Evento añadido a la agenda.',
      recordatorio: 'Recordatorio programado.',
    }
    setSuccessMsg(labels[tipo])
    setTimeout(() => setSuccessMsg(null), 3000)
    onCreated()
  }

  return (
    <section className="executive-surface overflow-hidden rounded-2xl border">
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-500">Captura rápida</p>
            <h2 className="mt-1 text-lg font-semibold text-stone-950">
              ¿Qué necesitas capturar?
            </h2>
          </div>
          <div className="hidden rounded-full bg-stone-950 px-3 py-1 text-[11px] font-semibold text-white sm:block">
            Assistant
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              title={tab.hint}
              className={`tap-target whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                active === tab.id
                  ? 'bg-stone-950 text-white shadow-sm'
                  : 'bg-white/80 text-stone-600 ring-1 ring-inset ring-stone-200 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[184px] px-4 py-4 sm:px-5 sm:py-5">
        {active === 'tarea' && (
          <QuickAddTask onCreated={() => handleCreated('tarea')} />
        )}
        {active === 'evento' && (
          <QuickAddEvent onCreated={() => handleCreated('evento')} />
        )}
        {active === 'recordatorio' && (
          <QuickAddReminder onCreated={() => handleCreated('recordatorio')} />
        )}
      </div>

      <div className="min-h-[44px] px-4 pb-4 sm:px-5">
        {successMsg && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
            {successMsg}
          </p>
        )}
      </div>
    </section>
  )
}
