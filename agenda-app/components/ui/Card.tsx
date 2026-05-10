import { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
  className?: string
  description?: string
  action?: ReactNode
  tone?: 'default' | 'quiet' | 'elevated'
}

const TONES = {
  default: 'bg-white ring-1 ring-stone-200/80',
  quiet: 'bg-transparent',
  elevated: 'bg-white shadow-[0_4px_24px_rgba(28,25,23,0.08)] ring-1 ring-stone-200/60',
}

export function Card({
  title,
  children,
  className = '',
  description,
  action,
  tone = 'default',
}: CardProps) {
  return (
    <section className={`rounded-2xl ${TONES[tone]} ${className}`}>
      <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-normal text-stone-950">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-snug text-stone-400">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </section>
  )
}
