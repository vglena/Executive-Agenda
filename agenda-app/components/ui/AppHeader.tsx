'use client'

import Link from 'next/link'

// ─── Icon primitives ──────────────────────────────────────────────────────────

function IconSync({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'animate-spin' : undefined}
      aria-hidden
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
}

function IconSignOut() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconFocus() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ─── Shared header date formatting ───────────────────────────────────────────

function HeaderDate({ compact = false }: { compact?: boolean }) {
  const now = new Date()
  const weekday = now.toLocaleDateString('es', { weekday: 'short' })
  const day = now.getDate()
  const month = now.toLocaleDateString('es', { month: 'short' })

  if (compact) {
    // "lun · 10 may"
    const parts = `${weekday} · ${day} ${month}`.toLowerCase()
    return <>{parts.charAt(0).toUpperCase() + parts.slice(1)}</>
  }

  const full = now.toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).toLowerCase()
  return <>{full.charAt(0).toUpperCase() + full.slice(1)}</>
}

// ─── AppHeader ────────────────────────────────────────────────────────────────

export interface AppHeaderProps {
  /** Page title shown in the header. Defaults to "Hoy". */
  title?: string
  /** Back link shown on desktop only (e.g. to /dashboard from /priorities) */
  backHref?: string
  backLabel?: string
  /** Whether sync button should appear */
  showSync?: boolean
  syncing?: boolean
  onSync?: () => void
  /** Whether foco link (desktop) should appear */
  showFoco?: boolean
  /** Whether the sign-out button should appear */
  showSignOut?: boolean
  onSignOut?: () => void
  /** Inline sync feedback message */
  syncMessage?: string | null
}

export function AppHeader({
  title = 'Hoy',
  backHref,
  backLabel = 'Atrás',
  showSync = false,
  syncing = false,
  onSync,
  showFoco = false,
  showSignOut = true,
  onSignOut,
  syncMessage,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5">

        {/* Left — title + date */}
        <div className="flex min-w-0 items-center gap-2.5">
          {backHref && (
            <Link
              href={backHref}
              className="hidden tap-target items-center rounded-lg px-2 text-xs font-medium text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 sm:flex"
            >
              {backLabel}
            </Link>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-medium leading-none text-stone-400">
              <HeaderDate compact />
            </p>
            <h1 className="mt-0.5 text-base font-semibold leading-tight text-stone-950">
              {title}
            </h1>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex shrink-0 items-center gap-1">

          {/* Sync — icon-only on mobile, icon+label on desktop */}
          {showSync && (
            <button
              onClick={onSync}
              disabled={syncing}
              title={syncing ? 'Sincronizando…' : 'Sincronizar Google Calendar'}
              className="tap-target flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-40"
            >
              <IconSync spinning={syncing} />
              <span className="hidden sm:inline">{syncing ? 'Actualizando…' : 'Sync'}</span>
            </button>
          )}

          {/* Mi día link — desktop only (mobile uses BottomNav) */}
          {showFoco && (
            <Link
              href="/priorities"
              title="Mi día"
              className="tap-target hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 sm:flex"
            >
              <IconFocus />
              <span>Mi día</span>
            </Link>
          )}

          {/* Avatar / sign-out */}
          {showSignOut && (
            <button
              onClick={onSignOut}
              title="Cerrar sesión"
              className="tap-target flex items-center justify-center rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <IconSignOut />
              <span className="sr-only">Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync feedback banner */}
      {syncMessage && (
        <div className="border-t border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-700 sm:px-6">
          {syncMessage}
        </div>
      )}
    </header>
  )
}
