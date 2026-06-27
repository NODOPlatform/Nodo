import type { ComponentChildren } from 'preact'

interface BadgeProps {
  children: ComponentChildren
  color?: string
  class?: string
  size?: 'sm' | 'md'
  icon?: string
}

const SIZE_STYLES: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
}

export function Badge({ children, color = '#6b7280', class: className = '', size = 'md', icon }: BadgeProps) {
  return (
    <span
      class={`inline-flex items-center gap-1 rounded-full font-medium ${SIZE_STYLES[size]} ${className}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  )
}
