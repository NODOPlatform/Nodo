import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { insights, matchSuggestions, intelligenceLoaded, loadIntelligence, type Insight, type MatchSuggestion } from '../store/intelligence'

const SEVERITY_STYLES = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-300',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
}

const URGENCY_DOTS: Record<string, string> = {
  critical: 'bg-red-500 animate-pulse',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

function InsightCard({ insight }: { insight: Insight }) {
  const { route } = useLocation()
  const style = SEVERITY_STYLES[insight.severity]

  return (
    <button
      onClick={() => insight.actionUrl && route(insight.actionUrl)}
      disabled={!insight.actionUrl}
      class={`w-full text-left px-3 py-2.5 rounded-xl border ${style} transition-all duration-200 ${insight.actionUrl ? 'cursor-pointer hover:brightness-110 active:scale-[0.98]' : 'cursor-default'}`}
    >
      <div class="flex items-start gap-2">
        <span class="text-sm flex-shrink-0 mt-0.5">{insight.icon}</span>
        <p class="text-[12px] leading-snug flex-1">{insight.text}</p>
      </div>
    </button>
  )
}

function MatchCard({ match }: { match: MatchSuggestion }) {
  const { route } = useLocation()
  const urgDot = URGENCY_DOTS[match.needUrgency] || URGENCY_DOTS.medium

  return (
    <div class="bg-nodo-card border border-nodo-border rounded-xl p-3 space-y-2">
      <div class="flex items-center gap-2">
        <span class="text-sm">{match.needIcon}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class={`w-2 h-2 rounded-full flex-shrink-0 ${urgDot}`} />
            <span class="text-[12px] font-semibold text-white truncate">{match.needTitle}</span>
          </div>
          <span class="text-[10px] text-nodo-muted">{match.needLocation}</span>
        </div>
      </div>
      <div class="space-y-1">
        {match.matches.map((m, i) => (
          <button
            key={i}
            onClick={() => route(m.actionUrl)}
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/15 transition-colors active:scale-[0.98]"
          >
            <span class="text-xs">{m.icon}</span>
            <span class="text-[11px] flex-1 text-left truncate">{m.title}</span>
            {m.distance && <span class="text-[10px] text-emerald-400/60 flex-shrink-0">{m.distance}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export function NationalIntelligence() {
  useEffect(() => {
    if (!intelligenceLoaded.value) loadIntelligence()
    const interval = setInterval(loadIntelligence, 5 * 60000)
    return () => clearInterval(interval)
  }, [])

  const insightList = insights.value
  const matches = matchSuggestions.value

  if (!intelligenceLoaded.value && insightList.length === 0) return null

  return (
    <div class="px-4 mb-4 space-y-3">
      {/* Insights */}
      {insightList.length > 0 && (
        <div>
          <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span class="text-base">🧠</span> Inteligencia operacional
          </h2>
          <div class="space-y-1.5">
            {insightList.slice(0, 6).map(i => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
        </div>
      )}

      {/* Matching */}
      {matches.length > 0 && (
        <div>
          <h3 class="text-[12px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>🔗</span> Puedes ayudar aqui
          </h3>
          <div class="space-y-2">
            {matches.slice(0, 3).map(m => (
              <MatchCard key={m.needId} match={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
