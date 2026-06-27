import type { ComponentChildren } from 'preact'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  fullWidth?: boolean
  children?: ComponentChildren
  class?: string
  disabled?: boolean
  type?: string
  onClick?: (e: Event) => void
  icon?: ComponentChildren
  iconOnly?: boolean
  success?: boolean
}

const VARIANTS: Record<string, string> = {
  primary: 'bg-nodo-red text-white hover:bg-red-700 shadow-lg shadow-red-900/20',
  secondary: 'bg-nodo-card text-white border border-nodo-border hover:bg-white/[0.08]',
  danger: 'bg-red-900/60 text-red-200 border border-red-700/50 hover:bg-red-800/60',
  ghost: 'text-nodo-muted hover:text-white hover:bg-white/[0.06]',
  outline: 'bg-transparent text-white border border-nodo-border hover:bg-white/[0.06]',
}

const SIZES: Record<string, string> = {
  sm: 'px-3.5 py-2 text-sm gap-1.5',
  md: 'px-5 py-3 text-[15px] gap-2',
  lg: 'px-6 py-3.5 text-base gap-2',
  xl: 'px-6 py-4 text-lg gap-2',
}

const MIN_HEIGHTS: Record<string, string> = {
  sm: '36px',
  md: '44px',
  lg: '48px',
  xl: '56px',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  class: className = '',
  disabled,
  type,
  onClick,
  icon,
  iconOnly = false,
  success = false,
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none'

  const successClass = success ? 'bg-emerald-600 text-white border-emerald-500' : ''
  const iconOnlyClass = iconOnly ? 'p-0 aspect-square' : ''

  return (
    <button
      class={`${base} ${successClass || VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${iconOnlyClass} ${className}`}
      style={{ minHeight: MIN_HEIGHTS[size] }}
      disabled={disabled || loading}
      type={type as any}
      onClick={onClick}
    >
      {loading ? (
        <svg class="animate-spin flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : success ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : icon ? (
        <span class="flex-shrink-0">{icon}</span>
      ) : null}
      {!iconOnly && children}
    </button>
  )
}
