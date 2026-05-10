interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="px-1 py-4">
      <p className="text-sm font-medium text-stone-500">{title}</p>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-stone-400">{description}</p>
      )}
    </div>
  )
}
