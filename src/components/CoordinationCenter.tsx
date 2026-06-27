import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { nearbyNeeds, coordinationLoading, coordinationLoaded, loadNearbyNeeds, userLocation } from '../store/coordination'
import { getCurrentPosition } from '../lib/geolocation'
import type { NearbyNeed } from '../store/coordination'

const URGENCY_BORDER: Record<string, string> = {
  critical: '#dc262640',
  high: '#f9731640',
  medium: '#eab30840',
  low: '#22c55e30',
}

function NeedCard({ need }: { need: NearbyNeed }) {
  const { route } = useLocation()

  const handleView = () => {
    route(`/mapa?lat=${need.lat}&lng=${need.lng}&zoom=16`)
  }

  const handleHelp = () => {
    if (need.type === 'campaign') {
      route(`/campana/${need.id}`)
      return
    }
    if (need.contact_whatsapp) {
      const num = need.contact_whatsapp.replace(/\D/g, '')
      window.open(`https://wa.me/${num}`, '_blank')
    } else {
      handleView()
    }
  }

  return (
    <div
      class="bg-nodo-card rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 hover:bg-white/[0.04] border"
      style={{ borderColor: URGENCY_BORDER[need.urgency] || URGENCY_BORDER.medium, minWidth: '220px', maxWidth: '260px' }}
    >
      <div class="flex items-start gap-2.5">
        <span class="text-xl flex-shrink-0">{need.icon}</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold leading-tight line-clamp-2">{need.title}</p>
          {need.blood_type && need.blood_type !== 'not_applicable' && (
            <span
              class="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: '#fecdd3', color: '#be123c' }}
            >🩸 {need.blood_type}</span>
          )}
          {need.donor_count != null && need.donor_count > 0 && (
            <span class="inline-block mt-1 ml-1 text-[10px] font-medium text-nodo-muted">
              {need.donors_confirmed || 0}/{need.donor_count} donantes
            </span>
          )}
        </div>
        <span
          class="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
          style={{ color: need.urgencyColor, background: `${need.urgencyColor}18` }}
        >
          {need.urgencyLabel}
        </span>
      </div>

      <div class="flex items-center gap-1.5 text-[10px] text-nodo-muted">
        <span>📍 {need.location}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[10px] text-nodo-muted">
        <span>📏 A {need.distanceText}</span>
      </div>

      <div class="flex gap-2 mt-auto">
        <button
          onClick={handleView}
          class="flex-1 text-[10px] font-semibold py-1.5 rounded-lg border border-nodo-border bg-nodo-dark text-nodo-text hover:bg-white/[0.06] transition-colors text-center"
        >
          Ver
        </button>
        <button
          onClick={handleHelp}
          class="flex-1 text-[10px] font-semibold py-1.5 rounded-lg text-white transition-colors text-center"
          style={{ background: need.type === 'campaign' ? '#8b5cf6' : '#2563eb' }}
        >
          {need.type === 'campaign' ? 'Participar' : 'Como ayudar'}
        </button>
      </div>
    </div>
  )
}

export function CoordinationCenter() {
  const geoError = useSignal<string | null>(null)
  const requesting = useSignal(false)

  useEffect(() => {
    if (userLocation.value) {
      loadNearbyNeeds(userLocation.value.lat, userLocation.value.lng)
      return
    }
    requestLocation()
  }, [])

  const requestLocation = async () => {
    requesting.value = true
    geoError.value = null
    try {
      const pos = await getCurrentPosition()
      await loadNearbyNeeds(pos.lat, pos.lng)
    } catch (e) {
      geoError.value = e instanceof Error && e.message === 'inapp'
        ? 'Abre esta pagina en tu navegador para usar ubicacion.'
        : 'Activa la ubicacion para ver necesidades cerca de ti.'
    } finally {
      requesting.value = false
    }
  }

  const needs = nearbyNeeds.value
  const loading = coordinationLoading.value
  const loaded = coordinationLoaded.value

  if (geoError.value) {
    return (
      <div class="mx-4 mb-4">
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 text-center">
          <span class="text-2xl block mb-2">📍</span>
          <p class="text-xs text-nodo-muted mb-3">{geoError.value}</p>
          <button
            onClick={requestLocation}
            class="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (loading && !loaded) {
    return (
      <div class="mx-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">🎯</span>
          <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider">Necesidades urgentes cerca de ti</h2>
        </div>
        <div class="flex justify-center py-6">
          <div class="w-6 h-6 border-2 border-nodo-muted border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (loaded && needs.length === 0) {
    return (
      <div class="mx-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">🎯</span>
          <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider">Necesidades urgentes cerca de ti</h2>
        </div>
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-5 text-center">
          <span class="text-2xl block mb-2">✅</span>
          <p class="text-xs text-nodo-muted">No hay necesidades urgentes cerca de tu ubicacion en este momento.</p>
        </div>
      </div>
    )
  }

  if (!loaded) return null

  return (
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-3 px-4">
        <span class="text-base">🎯</span>
        <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider">Necesidades urgentes cerca de ti</h2>
        <span class="text-[10px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full font-semibold ml-auto">{needs.length}</span>
      </div>
      <div class="scroll-fade px-4">
        <div class="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {needs.map(n => (
            <NeedCard key={n.id} need={n} />
          ))}
        </div>
      </div>
    </div>
  )
}
