import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { campaigns, campaignsLoading, campaignsLoaded, loadCampaigns } from '../store/campaigns'
import { CAMPAIGN_TYPES, VERIFICATION_LEVELS } from '../lib/constants'
import { CoverImage } from '../components/ui/MultiPhotoInput'
import type { OfficialCampaign } from '../types'

function CampaignCard({ c }: { c: OfficialCampaign }) {
  const { route } = useLocation()
  const ct = CAMPAIGN_TYPES.find(t => t.value === c.campaign_type)
  const vl = VERIFICATION_LEVELS.find(v => v.value === c.verification_level) || VERIFICATION_LEVELS[0]

  const dateText = (() => {
    if (!c.start_date) return null
    const start = new Date(c.start_date + 'T12:00:00')
    const s = start.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
    if (c.end_date && c.end_date !== c.start_date) {
      const end = new Date(c.end_date + 'T12:00:00')
      return `${s} — ${end.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}`
    }
    return s
  })()

  const isActive = (() => {
    if (!c.end_date) return true
    return new Date(c.end_date + 'T23:59:59') >= new Date()
  })()

  const images = (c.metadata?.images as string[]) || []

  return (
    <button
      class="w-full bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden text-left transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98]"
      onClick={() => route(`/campana/${c.id}`)}
    >
      <CoverImage images={images} name={c.title} height="h-32" />
      <div class="flex items-start gap-3 p-4">
        <div
          class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${vl.color}18` }}
        >
          {ct?.icon || '📢'}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
              style={{ color: vl.color, background: `${vl.color}18` }}
            >
              {vl.emoji} {vl.label}
            </span>
            {!isActive && (
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-400">Finalizada</span>
            )}
          </div>
          <h3 class="text-sm font-bold leading-tight line-clamp-2">{c.title}</h3>
          {c.organization && (
            <p class="text-[11px] text-nodo-muted mt-0.5">{c.organization}</p>
          )}
          <div class="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-nodo-muted">
            {dateText && <span>📅 {dateText}</span>}
            {c.opening_hours && <span>🕐 {c.opening_hours}</span>}
            {c.locations && c.locations.length > 0 && (
              <span>📍 {c.locations.length} {c.locations.length === 1 ? 'ubicacion' : 'ubicaciones'}</span>
            )}
          </div>
        </div>
        <svg class="w-4 h-4 text-nodo-muted flex-shrink-0 mt-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </button>
  )
}

export function Campaigns() {
  const { route } = useLocation()
  const filter = useSignal<string>('all')

  useEffect(() => { loadCampaigns() }, [])

  const filtered = filter.value === 'all'
    ? campaigns.value
    : campaigns.value.filter(c => c.campaign_type === filter.value)

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto animate-fade-in">
      <div class="flex items-center gap-3 mb-5">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 class="text-xl font-bold">Campanas verificadas</h2>
          <p class="text-xs text-nodo-muted">Acciones organizadas activas</p>
        </div>
      </div>

      {/* Filter chips */}
      <div class="scroll-fade mb-4">
        <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            class="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              background: filter.value === 'all' ? 'rgba(37,99,235,0.15)' : 'var(--nodo-card)',
              borderColor: filter.value === 'all' ? '#2563eb' : 'var(--nodo-border)',
              color: filter.value === 'all' ? '#60a5fa' : 'inherit',
            }}
            onClick={() => { filter.value = 'all' }}
          >
            Todas
          </button>
          {CAMPAIGN_TYPES.slice(0, 8).map(ct => (
            <button
              key={ct.value}
              class="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap"
              style={{
                background: filter.value === ct.value ? 'rgba(37,99,235,0.15)' : 'var(--nodo-card)',
                borderColor: filter.value === ct.value ? '#2563eb' : 'var(--nodo-border)',
                color: filter.value === ct.value ? '#60a5fa' : 'inherit',
              }}
              onClick={() => { filter.value = ct.value }}
            >
              {ct.icon} {ct.label}
            </button>
          ))}
        </div>
      </div>

      {campaignsLoading.value && !campaignsLoaded.value && (
        <div class="flex justify-center py-12">
          <div class="w-6 h-6 border-2 border-nodo-muted border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {campaignsLoaded.value && filtered.length === 0 && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-8 text-center">
          <div class="text-4xl mb-3">📢</div>
          <p class="text-sm text-nodo-muted">No hay campanas activas en esta categoria.</p>
        </div>
      )}

      <div class="space-y-3">
        {filtered.map(c => <CampaignCard key={c.id} c={c} />)}
      </div>
    </div>
  )
}
