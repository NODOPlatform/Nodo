import { EVIDENCE_CONFIG } from '../lib/connect/evidence-engine'
import type { HumanitarianContext as HCtx } from '../lib/connect/humanitarian-context'

function staleness(date: string | null): string {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function HumanitarianContext({ context }: { context: HCtx }) {
  return (
    <div class="bg-gradient-to-b from-nodo-card to-nodo-card/80 border border-nodo-border rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-base">🔗</span>
        <h4 class="text-sm font-bold text-white">Contexto humanitario</h4>
        <span class="text-[10px] text-nodo-muted">{context.totalLinks} relacion{context.totalLinks === 1 ? '' : 'es'}</span>
      </div>
      <p class="text-[10px] text-nodo-muted mb-3">
        Informacion relacionada con <strong class="text-white">{context.subjectName}</strong>
      </p>

      <div class="space-y-3">
        {context.categories.map(cat => (
          <div key={cat.entityType}>
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="text-xs">{cat.icon}</span>
              <span class="text-[11px] font-semibold text-white/70">{cat.label}</span>
            </div>
            <div class="space-y-1.5">
              {cat.links.map(link => {
                const evCfg = link.evidenceLevel ? EVIDENCE_CONFIG[link.evidenceLevel] : null
                return (
                  <div key={link.id} class="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-[12px] font-semibold text-white leading-tight truncate">{link.name}</p>
                        <p class="text-[10px] text-blue-400/80 mt-0.5">{link.relation}</p>
                      </div>
                      <div class="flex flex-col items-end gap-0.5 flex-shrink-0">
                        {evCfg && (
                          <span class="text-[8px] px-1 py-0.5 rounded" style={{ color: evCfg.color, background: evCfg.bg }}>
                            {evCfg.icon}
                          </span>
                        )}
                        {link.lastUpdated && (
                          <span class="text-[8px] text-nodo-muted">{staleness(link.lastUpdated)}</span>
                        )}
                      </div>
                    </div>
                    <span class="text-[8px] text-nodo-muted">{link.source}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div class="flex flex-wrap gap-1 mt-3 pt-2 border-t border-white/[0.06]">
        <span class="text-[8px] text-nodo-muted">Fuentes:</span>
        {context.sources.map(s => (
          <span key={s} class="text-[8px] bg-white/[0.06] text-white/50 px-1.5 py-0.5 rounded">{s}</span>
        ))}
      </div>
    </div>
  )
}
