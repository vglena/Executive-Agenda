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
  default: 'executive-surface border shadow-sm',
  quiet: 'bg-transparent border border-transparent shadow-none',
  elevated: 'bg-white border border-stone-200 shadow-[0_18px_45px_rgba(31,41,55,0.10)]',
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
    <section className={`rounded-xl ${TONES[tone]} ${className}`}>
      <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-stone-950 tracking-normal">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-stone-500 mt-0.5 leading-snug">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </section>
  )
}
