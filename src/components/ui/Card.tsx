import type { ComponentChildren } from 'preact'

interface CardProps {
  children: ComponentChildren
  variant?: 'default' | 'interactive' | 'emergency' | 'highlighted'
  class?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg'
}

const VARIANT_STYLES: Record<string, string> = {
  default: 'bg-nodo-card border border-nodo-border',
  interactive: 'bg-nodo-card border border-nodo-border cursor-pointer hover:bg-white/[0.06] active:scale-[0.98]',
  emergency: 'bg-red-500/[0.08] border border-red-500/30',
  highlighted: 'bg-blue-500/[0.08] border border-blue-500/30',
}

const PADDING_STYLES: Record<string, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({ children, variant = 'default', class: className = '', onClick, padding = 'md' }: CardProps) {
  const isClickable = variant === 'interactive' || !!onClick
  const variantClass = onClick && variant === 'default' ? VARIANT_STYLES.interactive : VARIANT_STYLES[variant]

  return (
    <div
      class={`rounded-2xl transition-all duration-200 ${variantClass} ${PADDING_STYLES[padding]} ${className}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && onClick) { e.preventDefault(); onClick() } } : undefined}
    >
      {children}
    </div>
  )
}
