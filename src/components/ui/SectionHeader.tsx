import type { ComponentChildren } from 'preact'

interface SectionHeaderProps {
  icon?: string
  title: string
  subtitle?: string
  badge?: string | number
  badgeColor?: string
  action?: ComponentChildren
  class?: string
}

export function SectionHeader({ icon, title, subtitle, badge, badgeColor, action, class: className = '' }: SectionHeaderProps) {
  return (
    <div class={`flex items-center gap-2 mb-2.5 ${className}`}>
      {icon && <span class="text-base flex-shrink-0">{icon}</span>}
      <div class="flex-1 min-w-0">
        <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider leading-tight">{title}</h2>
        {subtitle && <p class="text-[11px] text-nodo-muted/70 mt-0.5">{subtitle}</p>}
      </div>
      {badge != null && (
        <span
          class="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            color: badgeColor || '#94a3b8',
            background: badgeColor ? `${badgeColor}18` : 'rgba(148,163,184,0.12)',
            border: `1px solid ${badgeColor ? `${badgeColor}30` : 'rgba(148,163,184,0.2)'}`,
          }}
        >
          {badge}
        </span>
      )}
      {action && <div class="flex-shrink-0">{action}</div>}
    </div>
  )
}
