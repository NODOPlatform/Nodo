interface DividerProps {
  class?: string
  label?: string
}

export function Divider({ class: className = '', label }: DividerProps) {
  if (label) {
    return (
      <div class={`flex items-center gap-3 my-4 ${className}`}>
        <div class="flex-1 h-px bg-nodo-border" />
        <span class="text-[11px] font-semibold text-nodo-muted uppercase tracking-wider">{label}</span>
        <div class="flex-1 h-px bg-nodo-border" />
      </div>
    )
  }

  return <div class={`h-px bg-nodo-border my-4 ${className}`} />
}
