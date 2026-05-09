interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/70 px-4 py-5">
      <p className="text-sm font-medium text-stone-700">{title}</p>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>
      )}
    </div>
  )
}
