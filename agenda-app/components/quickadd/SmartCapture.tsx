'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { apiFetch } from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type CaptureType = 'tarea' | 'evento' | 'recordatorio'

interface SmartCaptureProps {
  onCreated: (type: CaptureType) => void
}

// ─── Heuristic parser ─────────────────────────────────────────────────────────

function detectType(text: string): CaptureType {
  const t = text.toLowerCase()

  // Reminder keywords take priority
  if (/\brecordar(me)?\b|\bavisar(me)?\b|\bno olvidar\b|\brecordatorio\b/.test(t)) {
    return 'recordatorio'
  }

  // Event: meeting/social words OR has an explicit time pattern
  const hasEventWord = /\breuni[oó]n\b|\bcena\b|\balmuerzo\b|\bdesayuno\b|\bmeeting\b|\bconferencia\b|\bpresentaci[oó]n\b|\bvisita\b|\bllamada\b|\bllamar\b|\bvideollamada\b|\bvideoc[oó]nferencia\b/.test(t)
  const hasTime = /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(am|pm)\b|\b(?:a las|las)\s+\d{1,2}\b/i.test(t)

  if (hasEventWord || hasTime) return 'evento'

  return 'tarea'
}

/** Parse natural-language date to YYYY-MM-DD. Returns today if not found. */
function parseDate(text: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const t = text.toLowerCase()

  if (/pasado ma[nñ]ana/.test(t)) {
    const d = new Date(today)
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  }
  if (/\bma[nñ]ana\b/.test(t)) {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const weekdays = ['domingo', 'lunes', 'martes', 'mi[eé]rcoles', 'jueves', 'viernes', 's[aá]bado']
  for (let i = 0; i < weekdays.length; i++) {
    if (new RegExp(`\\b${weekdays[i]}\\b`).test(t)) {
      const d = new Date(today)
      const diff = ((i - d.getDay()) + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      return d.toISOString().split('T')[0]
    }
  }

  return today.toISOString().split('T')[0]
}

/** Parse time from text. Returns HH:MM string or null. */
function parseTime(text: string): string | null {
  // "HH:MM" explicit
  const colonMatch = text.match(/\b(\d{1,2}):(\d{2})\b/)
  if (colonMatch) {
    const h = parseInt(colonMatch[1])
    const m = parseInt(colonMatch[2])
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }

  // "Xam" / "Xpm"
  const ampmMatch = text.match(/\b(\d{1,2})\s*(am|pm)\b/i)
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1])
    const meridiem = ampmMatch[2].toLowerCase()
    if (meridiem === 'pm' && h < 12) h += 12
    if (meridiem === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:00`
  }

  // "las X" / "a las X"
  const lasMatch = text.match(/(?:a\s+las|las)\s+(\d{1,2})/i)
  if (lasMatch) {
    const h = parseInt(lasMatch[1])
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:00`
    }
  }

  return null
}

/** Add 60 minutes to HH:MM string */
function addOneHour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const totalMins = h * 60 + m + 60
  return `${String(Math.floor(totalMins / 60) % 24).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`
}

/**
 * Strip date/time/action keywords from text to get a clean title.
 * We do NOT over-strip — just remove the most obvious filler.
 */
function cleanTitle(text: string): string {
  return text
    .replace(/\brecordar(me)?\b/gi, '')
    .replace(/\bavisar(me)?\b/gi, '')
    .replace(/\bno olvidar\b/gi, '')
    .replace(/\bpasado ma[nñ]ana\b/gi, '')
    .replace(/\bma[nñ]ana\b/gi, '')
    .replace(/\bhoy\b/gi, '')
    .replace(/\b(?:el\s+)?(?:pr[oó]ximo\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi, '')
    .replace(/\b\d{1,2}:\d{2}\b/g, '')
    .replace(/\b\d{1,2}\s*(am|pm)\b/gi, '')
    .replace(/\b(?:a\s+las|las)\s+\d{1,2}\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CaptureType, { label: string; color: string; icon: string }> = {
  tarea: { label: 'Tarea', color: 'bg-stone-100 text-stone-700', icon: '✓' },
  evento: { label: 'Evento', color: 'bg-blue-100 text-blue-700', icon: '◷' },
  recordatorio: { label: 'Recordatorio', color: 'bg-amber-100 text-amber-700', icon: '◌' },
}

const EXAMPLES = [
  'Cena con Juan mañana 20:00',
  'Reunión consejo viernes 9am',
  'Recordarme llamar a Marta',
  'Cerrar propuesta antes del viernes',
]

// ─── SmartCapture ─────────────────────────────────────────────────────────────

export function SmartCapture({ onCreated }: SmartCaptureProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const detectedType: CaptureType = text.trim() ? detectType(text) : 'tarea'
  const typeConfig = TYPE_CONFIG[detectedType]
  const hasText = text.trim().length > 0

  function showFeedback(ok: boolean, msg: string) {
    setFeedback({ ok, msg })
    setTimeout(() => setFeedback(null), 3500)
  }

  async function submit() {
    const raw = text.trim()
    if (!raw) return

    setLoading(true)
    try {
      const type = detectType(raw)
      const title = cleanTitle(raw) || raw

      if (type === 'evento') {
        const fecha = parseDate(raw)
        const rawTime = parseTime(raw)
        const defaultHora = (() => {
          const d = new Date()
          d.setMinutes(0, 0, 0)
          d.setHours(d.getHours() + 1)
          return `${String(d.getHours()).padStart(2, '0')}:00`
        })()
        const horaInicio = rawTime ?? defaultHora
        const horaFin = addOneHour(horaInicio)

        type EventResponse = { evento: { conflicto_detectado: boolean } }
        const { evento } = await apiFetch<EventResponse>('/api/events', {
          method: 'POST',
          body: JSON.stringify({ titulo: title, fecha, hora_inicio: horaInicio, hora_fin: horaFin }),
        })
        const conflictNote = evento.conflicto_detectado ? ' · conflicto detectado.' : ''
        showFeedback(true, `Evento añadido${conflictNote}`)
        onCreated('evento')

      } else if (type === 'recordatorio') {
        // Create a task with the cleaned text; remind user to add reminder via form
        await apiFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ titulo: title, prioridad_manual: 'P3' }),
        })
        showFeedback(true, 'Tarea capturada. Añade el recordatorio desde el formulario.')
        onCreated('recordatorio')

      } else {
        const fecha = parseDate(raw)
        const hasDateHint = /ma[nñ]ana|pasado|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo/i.test(raw)
        await apiFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            titulo: title,
            prioridad_manual: 'P3',
            ...(hasDateHint ? { fecha_limite: fecha } : {}),
          }),
        })
        showFeedback(true, 'Tarea capturada.')
        onCreated('tarea')
      }

      setText('')
      inputRef.current?.focus()
    } catch (e: unknown) {
      showFeedback(false, e instanceof Error ? e.message : 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  // Rotating placeholder
  const placeholder = EXAMPLES[Math.floor(Date.now() / 10000) % EXAMPLES.length]

  return (
    <div className="space-y-2">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            maxLength={300}
            disabled={loading}
            autoComplete="off"
            className="tap-target w-full rounded-2xl border border-stone-200 bg-white py-3 pl-4 pr-28 text-base text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60 disabled:opacity-50"
          />
          {/* Inline type badge */}
          {hasText && (
            <span
              className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeConfig.color}`}
            >
              {typeConfig.icon} {typeConfig.label}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading || !hasText}
          className="tap-target shrink-0 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40"
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            '↑'
          )}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <p
          className={`rounded-xl px-3 py-2 text-xs font-medium ${
            feedback.ok
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
              : 'bg-rose-50 text-rose-800 ring-1 ring-rose-100'
          }`}
        >
          {feedback.msg}
        </p>
      )}
    </div>
  )
}
