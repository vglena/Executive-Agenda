type DateStyle = 'compact' | 'long'

function parseDateOnly(dateISO: string): Date {
  const [year, month, day] = dateISO.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateOnly(dateISO: string, style: DateStyle = 'compact'): string {
  const date = parseDateOnly(dateISO)
  if (style === 'long') {
    return date.toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }
  return date.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateTime(
  iso: string | null,
  options: { style?: DateStyle; hasExplicitTime?: boolean } = {}
): string {
  if (!iso) return 'Sin fecha'

  const { style = 'compact', hasExplicitTime = true } = options
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso)

  if (dateOnly) {
    const date = formatDateOnly(iso, style)
    return hasExplicitTime ? date : `${date} · sin hora`
  }

  const date = new Date(iso)
  const dateLabel = date.toLocaleDateString('es', style === 'long'
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { weekday: 'short', day: 'numeric', month: 'short' })
  const timeLabel = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  return `${dateLabel} · ${timeLabel}`
}

export function formatTimeRange(
  dateISO: string,
  startTime: string,
  endTime: string,
  style: DateStyle = 'compact'
): string {
  return `${formatDateOnly(dateISO, style)} · ${startTime}-${endTime}`
}

export function formatRelativeDate(dateISO: string | null): string {
  if (!dateISO) return 'Sin fecha'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = parseDateOnly(dateISO)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Mañana'
  if (diffDays === -1) return 'Ayer'
  if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`
  return `En ${diffDays} días`
}

export function formatTaskDeadline(dateISO: string | null, style: DateStyle = 'compact'): string {
  if (!dateISO) return 'Sin fecha'
  return formatDateTime(dateISO, { style, hasExplicitTime: false })
}
