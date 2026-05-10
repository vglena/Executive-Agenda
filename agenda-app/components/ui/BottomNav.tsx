'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  activeIcon?: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Hoy',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/priorities',
    label: 'Foco',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/dashboard#quickadd',
    label: 'Capturar',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-stone-200/80 bg-white/90 pb-safe backdrop-blur-xl sm:hidden"
      aria-label="Navegación principal"
    >
      {navItems.map((item) => {
        // Anchor links (e.g. /dashboard#quickadd) are never highlighted as active;
      // plain page links use exact match for /dashboard, prefix match for others.
      const hasAnchor = item.href.includes('#')
      const isActive = hasAnchor
        ? false
        : item.href === '/dashboard'
          ? pathname === '/dashboard'
          : (pathname ?? '').startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-stone-950'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <span
              className={`flex items-center justify-center rounded-xl p-1 transition-colors ${
                isActive ? 'bg-stone-100 text-stone-950' : ''
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
