import { Spinner } from './Spinner'

interface LoadingStateProps {
  message?: string
  class?: string
}

export function LoadingState({ message, class: className = '' }: LoadingStateProps) {
  return (
    <div class={`flex flex-col items-center justify-center py-8 gap-3 ${className}`}>
      <Spinner size="md" class="text-nodo-muted" />
      {message && <p class="text-xs text-nodo-muted">{message}</p>}
    </div>
  )
}
