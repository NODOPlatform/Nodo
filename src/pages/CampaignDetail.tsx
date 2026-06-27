import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation, useRoute } from 'preact-iso'
import { supabase } from '../lib/supabase'
import { CAMPAIGN_TYPES, VERIFICATION_LEVELS } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { CoverImage, PhotoGallery } from '../components/ui/MultiPhotoInput'
import type { OfficialCampaign } from '../types'

export function CampaignDetail() {
  const { route } = useLocation()
  const { params } = useRoute()
  const campaign = useSignal<OfficialCampaign | null>(null)
  const loading = useSignal(true)
  const error = useSignal<string | null>(null)

  useEffect(() => {
    if (!supabase || !params.id) { loading.value = false; return }
    supabase
      .from('official_campaigns')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data, error: err }) => {
        if (err) { error.value = 'Campana no encontrada'; loading.value = false; return }
        campaign.value = data as OfficialCampaign
        loading.value = false
      })
  }, [params.id])

  if (loading.value) {
    return (
      <div class="flex justify-center py-20">
        <div class="w-8 h-8 border-2 border-nodo-muted border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error.value || !campaign.value) {
    return (
      <div class="p-4 pb-20 max-w-lg mx-auto text-center pt-12">
        <div class="text-4xl mb-3">📢</div>
        <p class="text-nodo-muted">{error.value || 'Campana no encontrada'}</p>
        <button class="mt-4 text-blue-400 text-sm font-semibold" onClick={() => route('/campanas')}>Volver a campanas</button>
      </div>
    )
  }

  const c = campaign.value
  const ct = CAMPAIGN_TYPES.find(t => t.value === c.campaign_type)
  const vl = VERIFICATION_LEVELS.find(v => v.value === c.verification_level) || VERIFICATION_LEVELS[0]

  const dateText = (() => {
    if (!c.start_date) return null
    const start = new Date(c.start_date + 'T12:00:00')
    const s = start.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })
    if (c.end_date && c.end_date !== c.start_date) {
      const end = new Date(c.end_date + 'T12:00:00')
      return `${s} — ${end.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}`
    }
    return s
  })()

  const handleShare = async () => {
    const text = `📢 ${c.title}\n${dateText ? `📅 ${dateText}\n` : ''}${c.opening_hours ? `🕐 ${c.opening_hours}\n` : ''}\nMas info en: https://nodoayuda.com/campana/${c.id}`
    if (navigator.share) {
      try { await navigator.share({ title: c.title, text, url: `https://nodoayuda.com/campana/${c.id}` }) } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(text) } catch { /* fallback */ }
    }
  }

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto animate-fade-in">
      <div class="flex items-center gap-3 mb-5">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border" aria-label="Volver" onClick={() => route('/campanas')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="flex-1 min-w-0">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: vl.color, background: `${vl.color}18` }}>
            {vl.emoji} {vl.label}
          </span>
        </div>
      </div>

      {/* Cover photo */}
      <CoverImage images={(c.metadata?.images as string[]) || undefined} name={c.title} height="h-48" />

      {/* Header */}
      <div class="mb-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">{ct?.icon || '📢'}</span>
          <span class="text-xs text-nodo-muted font-medium">{ct?.label || 'Campana'}</span>
        </div>
        <h1 class="text-xl font-bold leading-tight">{c.title}</h1>
        {c.organization && (
          <p class="text-sm text-nodo-muted mt-1">Organiza: {c.organization}</p>
        )}
      </div>

      {/* Quick info */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 space-y-2.5 mb-4">
        {dateText && (
          <div class="flex items-center gap-2 text-sm">
            <span class="text-base">📅</span>
            <span>{dateText}</span>
          </div>
        )}
        {c.opening_hours && (
          <div class="flex items-center gap-2 text-sm">
            <span class="text-base">🕐</span>
            <span>{c.opening_hours}</span>
          </div>
        )}
        {c.contact_phone && (
          <div class="flex items-center gap-2 text-sm">
            <span class="text-base">📞</span>
            <a href={`tel:${c.contact_phone}`} class="text-blue-400">{c.contact_phone}</a>
          </div>
        )}
        {c.whatsapp && (
          <div class="flex items-center gap-2 text-sm">
            <span class="text-base">📱</span>
            <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener" class="text-green-400">WhatsApp</a>
          </div>
        )}
        {c.website && (
          <div class="flex items-center gap-2 text-sm">
            <span class="text-base">🌐</span>
            <a href={c.website} target="_blank" rel="noopener" class="text-blue-400 truncate">{c.website}</a>
          </div>
        )}
      </div>

      {/* Description */}
      {c.description && (
        <div class="mb-4">
          <h3 class="text-xs font-bold text-nodo-muted uppercase tracking-wider mb-2">Descripcion</h3>
          <p class="text-sm leading-relaxed whitespace-pre-line">{c.description}</p>
        </div>
      )}

      <PhotoGallery images={(c.metadata?.images as string[]) || undefined} />

      {/* Requirements */}
      {c.requirements && c.requirements.length > 0 && (
        <div class="mb-4">
          <h3 class="text-xs font-bold text-nodo-muted uppercase tracking-wider mb-2">Requisitos</h3>
          <div class="bg-nodo-card border border-nodo-border rounded-xl p-3 space-y-1.5">
            {c.requirements.map((r, i) => (
              <div key={i} class="flex items-start gap-2 text-sm">
                <span class="text-nodo-muted flex-shrink-0">•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {c.locations && c.locations.length > 0 && (
        <div class="mb-5">
          <h3 class="text-xs font-bold text-nodo-muted uppercase tracking-wider mb-2">Ubicaciones</h3>
          <div class="space-y-2">
            {c.locations.map((loc, i) => (
              <div key={i} class="bg-nodo-card border border-nodo-border rounded-xl p-3 flex items-center gap-3">
                <span class="text-lg flex-shrink-0">🏥</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{loc.name}</p>
                  {loc.address && <p class="text-[11px] text-nodo-muted">{loc.address}</p>}
                </div>
                {loc.lat && loc.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener"
                    class="text-[10px] font-semibold text-blue-400 flex-shrink-0"
                  >
                    Mapa
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div class="flex gap-3">
        <Button fullWidth onClick={handleShare}>📤 Compartir</Button>
        {c.whatsapp && (
          <Button fullWidth variant="secondary" onClick={() => window.open(`https://wa.me/${c.whatsapp!.replace(/\D/g, '')}`, '_blank')}>
            📱 WhatsApp
          </Button>
        )}
      </div>

      {c.source_url && (
        <div class="mt-4 text-center">
          <a href={c.source_url} target="_blank" rel="noopener" class="text-xs text-nodo-muted hover:text-blue-400">
            Ver fuente original →
          </a>
        </div>
      )}
    </div>
  )
}
