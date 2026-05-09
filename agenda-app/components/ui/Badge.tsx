type Variant =
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'activo'
  | 'cancelado'
  | 'disparado'
  | 'pendiente'
  | 'completada'
  | 'conflicto'

const CLASSES: Record<Variant, string> = {
  P1:        'bg-rose-50 text-rose-700 ring-rose-200',
  P2:        'bg-amber-50 text-amber-700 ring-amber-200',
  P3:        'bg-blue-50 text-blue-700 ring-blue-200',
  P4:        'bg-stone-100 text-stone-500 ring-stone-200',
  activo:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelado: 'bg-stone-100 text-stone-400 ring-stone-200',
  disparado: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  pendiente: 'bg-slate-100 text-slate-600 ring-slate-200',
  completada:'bg-emerald-50 text-emerald-700 ring-emerald-200',
  conflicto: 'bg-rose-50 text-rose-700 ring-rose-200',
}

interface BadgeProps {
  variant: Variant
  label?: string
}

const LABELS: Partial<Record<Variant, string>> = {
  P1: 'Alta',
  P2: 'Media',
  P3: 'Baja',
  P4: 'Mínima',
}

export function Badge({ variant, label }: BadgeProps) {
  const cls = CLASSES[variant] ?? 'bg-gray-100 text-gray-600'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5 ring-1 ring-inset ${cls}`}
    >
      {label ?? LABELS[variant] ?? variant}
    </span>
  )
}
