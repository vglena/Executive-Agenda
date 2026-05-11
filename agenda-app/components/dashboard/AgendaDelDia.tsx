'use client'

import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { AgendaEvent } from '@/lib/types/api'
import { Spinner } from '@/components/ui/Spinner'

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function nowMin(): number {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function durationLabel(start: string, end: string): string {
  const mins = toMin(end) - toMin(start)
  if (mins <= 0) return ''
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

type Slot = 'past' | 'current' | 'later'

function getSlot(ev: AgendaEvent, now: number): Slot {
  const s = toMin(ev.hora_inicio)
  const e = toMin(ev.hora_fin)
  if (now >= e) return 'past'
  if (now >= s) return 'current'
  return 'later'
}

// ─── Free-block detection ─────────────────────────────────────────────────────

interface FreeBlock { from: string; to: string; mins: number }

function freeBlocks(events: AgendaEvent[], threshold = 90): FreeBlock[] {
  const blocks: FreeBlock[] = []
  for (let i = 0; i < events.length - 1; i++) {
    const gap = toMin(events[i + 1].hora_inicio) - toMin(events[i].hora_fin)
    if (gap >= threshold) {
      blocks.push({ from: events[i].hora_fin, to: events[i + 1].hora_inicio, mins: gap })
    }
  }
  return blocks
}

// ─── NowIndicator ─────────────────────────────────────────────────────────────

function NowIndicator() {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="h-px flex-1 bg-blue-300/50" />
      <span className="flex items-center gap-1.5 rounded-full bg-blue-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm shadow-blue-200">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/80" />
        Ahora
      </span>
      <div className="h-px flex-1 bg-blue-300/50" />
    </div>
  )
}

// ─── FreeSlot ─────────────────────────────────────────────────────────────────

function FreeSlot({ block }: { block: FreeBlock }) {
  const h = Math.floor(block.mins / 60)
  const m = block.mins % 60
  const label = m === 0 ? `${h} h libre` : `${h} h ${m} min libres`
  return (
    <div className="mx-1 my-1 flex items-center gap-2 rounded-xl border border-dashed border-stone-200 px-3 py-2.5">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-stone-300" aria-hidden>
        <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
      </svg>
      <span className="text-xs text-stone-400">{block.from} – {block.to} · {label}</span>
    </div>
  )
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ ev, slot, isNext, onClick }: { ev: AgendaEvent; slot: Slot; isNext: boolean; onClick?: () => void }) {
  const duration = durationLabel(ev.hora_inicio, ev.hora_fin)
  const isPast = slot === 'past'
  const isCurrent = slot === 'current'

  const barColor = isCurrent
    ? 'bg-blue-500'
    : isPast
      ? 'bg-stone-200'
      : isNext
        ? 'bg-stone-400'
        : ev.conflicto_detectado
          ? 'bg-amber-300'
          : 'bg-stone-200'

  const cardBg = isCurrent
    ? 'bg-blue-50/70 ring-1 ring-blue-100'
    : isNext
      ? 'bg-white ring-1 ring-stone-200'
      : ev.conflicto_detectado && !isPast
        ? 'bg-amber-50/60 ring-1 ring-amber-100/70'
        : 'bg-stone-50/50'

  const opacity = isPast ? 'opacity-40' : 'opacity-100'

  return (
    <div
      className={`relative flex items-stretch rounded-2xl ${cardBg} ${opacity} transition-opacity ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}`}
      onClick={onClick}
    >
      <div className={`w-1 shrink-0 rounded-l-2xl ${barColor}`} />
      <div className="min-w-0 flex-1 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs tabular-nums font-medium ${isCurrent ? 'text-blue-600' : isPast ? 'text-stone-400' : 'text-stone-500'}`}>
            {ev.hora_inicio}
          </span>
          <span className="text-xs text-stone-300">–</span>
          <span className={`text-xs tabular-nums ${isPast ? 'text-stone-300' : 'text-stone-400'}`}>{ev.hora_fin}</span>
          {duration && (
            <span className={`ml-auto text-[10px] font-medium ${isPast ? 'text-stone-300' : 'text-stone-400'}`}>{duration}</span>
          )}
        </div>
        <p className={`mt-1 text-[15px] leading-snug ${isCurrent ? 'font-semibold text-stone-950' : isNext ? 'font-medium text-stone-800' : isPast ? 'text-stone-400' : 'text-stone-600'}`}>
          {ev.titulo}
        </p>
        {(ev.ubicacion || (ev.conflicto_detectado && !isPast)) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {ev.conflicto_detectado && !isPast && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">requiere decisión</span>
            )}
            {ev.ubicacion && (
              <span className={`text-[10px] ${isPast ? 'text-stone-300' : 'text-stone-400'}`}>{ev.ubicacion}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PastCollapse ─────────────────────────────────────────────────────────────

function PastCollapse({ items, onTap }: { items: AgendaEvent[]; onTap?: (ev: AgendaEvent) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-xs text-stone-400 transition hover:text-stone-600"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {open ? 'Ocultar anteriores' : `${items.length} anterior${items.length !== 1 ? 'es' : ''}`}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {items.map((ev) => <EventCard key={ev.id} ev={ev} slot="past" isNext={false} onClick={() => onTap?.(ev)} />)}
        </div>
      )}
    </div>
  )
}

// ─── AgendaDelDia (TimelineHoy) ───────────────────────────────────────────────

export function AgendaDelDia({ refreshKey = 0, onEventTap }: { refreshKey?: number; onEventTap?: (ev: AgendaEvent) => void }) {
  const [eventos, setEventos] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(nowMin())
  const nowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(nowMin()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setLoading(true)
    apiFetch<{ eventos: AgendaEvent[] }>(`/api/events?fecha=${todayISO()}`)
      .then((d) => setEventos(d.eventos))
      .catch(() => setEventos([]))
      .finally(() => setLoading(false))
  }, [refreshKey])

  useEffect(() => {
    if (!loading && nowRef.current) {
      nowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [loading])

  if (loading) {
    return (
      <section className="p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-stone-950">Hoy</h2>
        <Spinner />
      </section>
    )
  }

  if (eventos.length === 0) {
    return (
      <section className="px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-950">Hoy</h2>
          <span className="text-xs text-stone-400">Sin compromisos</span>
        </div>
        <p className="mt-1 text-xs text-stone-300">Día libre — espacio para lo que importa</p>
      </section>
    )
  }

  // Classify
  const classified = eventos.map((ev) => ({ ev, slot: getSlot(ev, now) }))

  // Mark first upcoming as "next"
  let nextMarked = false
  const withNext = classified.map(({ ev, slot }) => {
    const isNext = !nextMarked && slot === 'later'
    if (isNext) nextMarked = true
    return { ev, slot, isNext }
  })

  const pastItems = withNext.filter((x) => x.slot === 'past').map((x) => x.ev)
  const activeItems = withNext.filter((x) => x.slot !== 'past')

  const blocks = freeBlocks(activeItems.map((x) => x.ev))
  const freeMap = new Map(blocks.map((b) => [b.from, b]))

  const hasCurrent = activeItems.some((x) => x.slot === 'current')

  const currentEv = activeItems.find((x) => x.slot === 'current')
  const nextEv = activeItems.find((x) => x.isNext)
  const headerSub = currentEv
    ? `En curso: ${currentEv.ev.titulo}`
    : nextEv
      ? `Próximo: ${nextEv.ev.titulo} a las ${nextEv.ev.hora_inicio}`
      : activeItems.length === 0
        ? 'Compromisos del día completados'
        : ''

  return (
    <section className="p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-stone-950">Hoy</h2>
        {headerSub && <p className="mt-0.5 text-xs text-stone-400">{headerSub}</p>}
      </div>

      {activeItems.length > 0 && (
        <div className="space-y-1.5">
          {activeItems.map(({ ev, slot, isNext }, i) => (
            <div key={ev.id}>
              {/* NowIndicator before the first upcoming when nothing is current */}
              {isNext && !hasCurrent && i === activeItems.findIndex((x) => x.isNext) && (
                <div ref={nowRef} className="mb-1.5">
                  <NowIndicator />
                </div>
              )}
              {/* Anchor ref for current event */}
              {slot === 'current' && i === activeItems.findIndex((x) => x.slot === 'current') && (
                <div ref={nowRef} />
              )}

              <EventCard ev={ev} slot={slot} isNext={isNext} onClick={() => onEventTap?.(ev)} />

              {freeMap.has(ev.hora_fin) && <FreeSlot block={freeMap.get(ev.hora_fin)!} />}
            </div>
          ))}
        </div>
      )}

      {activeItems.length === 0 && (
        <div ref={nowRef} className="mb-1">
          <NowIndicator />
        </div>
      )}

      {pastItems.length > 0 && <PastCollapse items={pastItems} onTap={onEventTap} />}
    </section>
  )
}

