import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { priorityNeeds, prioritiesLoading, loadPriorities, LEVEL_CONFIG } from '../store/priorities'

interface Props {
  compact?: boolean
}

export function PriorityNeeds({ compact }: Props) {
  const { route } = useLocation()

  useEffect(() => {
    loadPriorities()
    const interval = setInterval(loadPriorities, 30000)
    return () => clearInterval(interval)
  }, [])

  const needs = priorityNeeds.value

  if (needs.length === 0 && prioritiesLoading.value) {
    return compact ? null : (
      <div class="flex justify-center py-6">
        <div class="w-6 h-6 border-2 border-nodo-muted border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (needs.length === 0) return null

  if (compact) {
    return (
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-3.5 mb-5">
        <p class="text-xs text-nodo-muted mb-2.5 font-semibold flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-red-500 inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          Lo que mas se necesita ahora
        </p>
        <div class="flex flex-wrap gap-2">
          {needs.slice(0, 5).map(n => {
            const cfg = LEVEL_CONFIG[n.level]
            return (
              <span
                key={n.type}
                class="text-xs bg-nodo-dark rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 border border-nodo-border"
              >
                <span>{n.icon}</span>
                <span class="text-nodo-muted">{n.label}</span>
                <span style={{ color: cfg.color }} class="font-bold">{n.count}</span>
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div class="mb-5">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-red-500 inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
            Necesidades prioritarias
          </h2>
          <p class="text-xs text-nodo-muted mt-0.5">Actualizado automaticamente</p>
        </div>
      </div>
      <div class="space-y-2.5 stagger">
        {needs.map(n => {
          const cfg = LEVEL_CONFIG[n.level]
          const maxCount = needs[0]?.count || 1
          const barPercent = Math.min(100, Math.round((n.count / maxCount) * 100))
          return (
            <button
              key={n.type}
              class="w-full bg-nodo-card border border-nodo-border rounded-2xl px-4 py-3.5 transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98] text-left"
              onClick={() => route(`/mapa?helpType=${n.type}`)}
            >
              <div class="flex items-center gap-3.5 mb-2">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${cfg.color}18` }}>
                  {n.icon}
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-semibold block">{n.label}</span>
                  <span class="text-xs text-nodo-muted">{n.count} {n.count === 1 ? 'solicitud' : 'solicitudes'}</span>
                </div>
                <span
                  class="text-[10px] font-bold flex-shrink-0 px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ color: cfg.color, background: `${cfg.color}18` }}
                >
                  {cfg.text}
                </span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${barPercent}%`, background: cfg.color }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
