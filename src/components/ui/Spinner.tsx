interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | number
  class?: string
}

const NAMED_SIZES: Record<string, number> = {
  sm: 16,
  md: 24,
  lg: 32,
}

export function Spinner({ size = 'md', class: className = '' }: SpinnerProps) {
  const px = typeof size === 'number' ? size : NAMED_SIZES[size]
  return (
    <svg class={`animate-spin ${className}`} width={px} height={px} viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
