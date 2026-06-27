interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  class?: string
}

export function ErrorState({ title = 'Algo salio mal', message, onRetry, class: className = '' }: ErrorStateProps) {
  return (
    <div class={`bg-red-500/[0.08] border border-red-500/30 rounded-2xl p-5 text-center ${className}`}>
      <span class="text-2xl block mb-2">⚠️</span>
      <p class="text-sm font-semibold text-red-300 mb-1">{title}</p>
      {message && <p class="text-xs text-red-300/70 leading-relaxed">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          class="mt-3 text-sm font-semibold text-red-300 hover:text-red-200 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
