import { EVIDENCE_CONFIG } from '../lib/connect/evidence-engine'
import type { HumanitarianBrief as Brief } from '../lib/connect/humanitarian-brief'

export function HumanitarianBrief({ brief }: { brief: Brief }) {
  const evCfg = brief.evidenceLevel ? EVIDENCE_CONFIG[brief.evidenceLevel] : null

  return (
    <div class="bg-gradient-to-b from-nodo-card to-nodo-card/80 border border-nodo-border rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-base">🧠</span>
        <h4 class="text-sm font-bold text-white">Resumen de la situacion</h4>
      </div>

      <div class="space-y-1.5 mb-3">
        {brief.sentences.map((s, i) => (
          <p key={i} class="text-[12px] text-white/80 leading-relaxed">{s}</p>
        ))}
      </div>

      {brief.hasResults && (
        <div class="flex items-start gap-4 pt-3 border-t border-white/[0.06]">
          {/* Confidence score */}
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-[10px] text-nodo-muted uppercase tracking-wider font-semibold">Confianza</span>
              <span class="text-[13px] font-bold text-white">{brief.confidence}%</span>
              <span class="text-[10px] text-nodo-muted">({brief.confidenceLabel})</span>
            </div>

            <div class="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
              <div
                class="h-full rounded-full transition-all"
                style={{
                  width: `${brief.confidence}%`,
                  background: brief.confidence >= 70 ? '#22c55e' : brief.confidence >= 40 ? '#eab308' : '#94a3b8',
                }}
              />
            </div>

            <div class="space-y-1">
              {brief.confidenceFactors.map((f, i) => (
                <div key={i} class="flex items-center gap-1.5">
                  <span class="text-[10px]">{f.met ? '✓' : '✗'}</span>
                  <span class={`text-[10px] ${f.met ? 'text-white/70' : 'text-white/30'}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence + timing */}
          <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
            {evCfg && (
              <span class="text-[9px] font-semibold px-2 py-0.5 rounded" style={{ color: evCfg.color, background: evCfg.bg }}>
                {evCfg.icon} {evCfg.label}
              </span>
            )}
            {brief.staleness && (
              <div class="text-right">
                <span class="text-[8px] text-nodo-muted block">Ultima actualizacion</span>
                <span class="text-[10px] text-white/70 font-semibold">{brief.staleness}</span>
              </div>
            )}
            <span class="text-[8px] text-nodo-muted">
              {brief.sourceCount} fuente{brief.sourceCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
