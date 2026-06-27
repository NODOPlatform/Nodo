interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  class?: string
}

export function EmptyState({ icon = '📭', title, description, action, class: className = '' }: EmptyStateProps) {
  return (
    <div class={`bg-nodo-card border border-nodo-border rounded-2xl p-6 text-center ${className}`}>
      <span class="text-3xl block mb-3">{icon}</span>
      <p class="text-sm font-semibold text-nodo-text mb-1">{title}</p>
      {description && <p class="text-xs text-nodo-muted leading-relaxed">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          class="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
