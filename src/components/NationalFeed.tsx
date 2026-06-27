import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { nationalFeed, nationalFeedLoaded, nationalFeedFilter, loadNationalFeed, type NationalFeedItem } from '../store/national-feed'

const FILTER_CHIPS: { value: string; label: string; icon: string }[] = [
  { value: 'all', label: 'Todo', icon: '📡' },
  { value: 'help_request', label: 'Solicitudes', icon: '🆘' },
  { value: 'help_offer', label: 'Ofertas', icon: '🤝' },
  { value: 'health_request', label: 'Salud', icon: '❤️' },
  { value: 'campaign', label: 'Campanas', icon: '📢' },
  { value: 'person', label: 'Personas', icon: '👤' },
  { value: 'incident', label: 'Incidentes', icon: '🚨' },
]

const URGENCY_DOT: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
}

function FeedCard({ item }: { item: NationalFeedItem }) {
  const { route } = useLocation()

  const handleShare = async (e: Event) => {
    e.stopPropagation()
    if (!item.shareText) return
    if (navigator.share) {
      try { await navigator.share({ text: item.shareText, url: 'https://nodoayuda.com' }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(item.shareText) } catch {}
    }
  }

  return (
    <div
      class="flex items-start gap-3 px-3.5 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
      onClick={() => item.actionUrl && route(item.actionUrl)}
    >
      <div class="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base bg-white/[0.06]">
        {item.icon}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 mb-0.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-nodo-muted">{item.typeLabel}</span>
          {item.urgency && URGENCY_DOT[item.urgency] && (
            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: URGENCY_DOT[item.urgency] }} />
          )}
          <span class="text-[10px] text-nodo-muted ml-auto flex-shrink-0">{item.time}</span>
        </div>
        <p class="text-[13px] leading-snug line-clamp-2">{item.text}</p>
        {item.location && (
          <p class="text-[11px] text-nodo-muted mt-0.5 flex items-center gap-1">
            <span class="flex-shrink-0">📍</span> {item.location}
          </p>
        )}
      </div>
      <div class="flex flex-col items-center gap-1.5 flex-shrink-0 mt-1">
        {item.actionUrl && (
          <svg class="w-3.5 h-3.5 text-nodo-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        )}
        {item.shareText && (
          <button
            onClick={handleShare}
            class="text-nodo-muted hover:text-white transition-colors p-0.5"
            aria-label="Compartir"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}

export function NationalFeed() {
  const expanded = useSignal(false)

  useEffect(() => {
    loadNationalFeed()
    const interval = setInterval(loadNationalFeed, 45000)
    return () => clearInterval(interval)
  }, [])

  const items = nationalFeed.value
  const loaded = nationalFeedLoaded.value
  const filter = nationalFeedFilter.value

  if (!loaded) {
    return (
      <div class="px-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-2 h-2 rounded-full bg-emerald-500" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider">Feed nacional</h2>
        </div>
        <div class="flex justify-center py-6">
          <div class="w-6 h-6 border-2 border-nodo-muted border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const filtered = filter === 'all'
    ? items
    : items.filter(i => {
        if (filter === 'person') return i.type === 'person_found' || i.type === 'person_search'
        return i.type === filter
      })

  const visible = expanded.value ? filtered : filtered.slice(0, 8)

  return (
    <div class="px-4 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-2 h-2 rounded-full bg-emerald-500" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
        <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider">Feed nacional</h2>
        <span class="text-[10px] bg-nodo-card border border-nodo-border text-nodo-muted px-2 py-0.5 rounded-full font-semibold ml-auto">
          {filtered.length}
        </span>
      </div>

      {/* Filter chips */}
      <div class="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-2">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => { nationalFeedFilter.value = chip.value }}
            class={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              filter === chip.value
                ? 'bg-white/[0.10] border-white/20 text-white'
                : 'bg-nodo-card border-nodo-border text-nodo-muted hover:bg-white/[0.04]'
            }`}
          >
            {chip.icon} {chip.label}
          </button>
        ))}
      </div>

      {/* Feed list */}
      {visible.length === 0 ? (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-5 text-center">
          <p class="text-xs text-nodo-muted">No hay actividad reciente en esta categoria.</p>
        </div>
      ) : (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden divide-y divide-nodo-border">
          {visible.map(item => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Expand/collapse */}
      {filtered.length > 8 && (
        <button
          onClick={() => { expanded.value = !expanded.value }}
          class="w-full mt-2 text-[11px] font-semibold text-nodo-muted hover:text-white py-2 transition-colors"
        >
          {expanded.value ? 'Ver menos' : `Ver todas (${filtered.length})`}
        </button>
      )}
    </div>
  )
}
