import type { ComponentType } from 'preact'

interface ActionCardProps {
  label: string
  icon?: string
  Icon?: ComponentType<{ size?: number; class?: string }>
  gradient: string
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  class?: string
  subtitle?: string
}

const SIZE_STYLES = {
  sm: { minH: '56px', iconSize: 22, textSize: 'text-[12px]', iconBox: 'w-9 h-9', gap: 'gap-1.5', padding: 'p-3' },
  md: { minH: '80px', iconSize: 26, textSize: 'text-[13px]', iconBox: 'w-11 h-11', gap: 'gap-2', padding: 'p-4' },
  lg: { minH: '100px', iconSize: 30, textSize: 'text-[14px]', iconBox: 'w-14 h-14', gap: 'gap-2.5', padding: 'p-5' },
}

export function ActionCard({ label, icon, Icon, gradient, onClick, size = 'md', class: className = '', subtitle }: ActionCardProps) {
  const s = SIZE_STYLES[size]

  return (
    <button
      onClick={onClick}
      class={`w-full rounded-2xl ${s.padding} flex flex-col items-center justify-center ${s.gap} text-white font-semibold shadow-lg shadow-black/20 transition-all duration-200 active:scale-[0.96] select-none ${className}`}
      style={{ background: gradient, minHeight: s.minH }}
    >
      <div class={`${s.iconBox} rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0`}>
        {Icon ? <Icon size={s.iconSize} class="text-white" /> : <span style={{ fontSize: `${s.iconSize}px` }}>{icon}</span>}
      </div>
      <div class="text-center">
        <span class={`${s.textSize} leading-tight block`}>{label}</span>
        {subtitle && <span class="text-[10px] text-white/60 block mt-0.5">{subtitle}</span>}
      </div>
    </button>
  )
}
