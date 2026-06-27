import { useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { supabase } from '../lib/supabase'
import { DEFAULT_CENTER, DEFAULT_ZOOM, TYPE_ICONS } from '../lib/constants'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MiniMarker {
  lat: number
  lng: number
  icon: string
}

export function HomeMiniMap() {
  const { route } = useLocation()
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const initDone = useRef(false)
  const loaded = useSignal(false)
  const markerCount = useSignal(0)
  const tileFailed = useSignal(false)

  useEffect(() => {
    if (initDone.current || !mapElRef.current) return
    initDone.current = true

    const el = mapElRef.current

    const map = L.map(el, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: DEFAULT_ZOOM - 1,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    })

    mapInstance.current = map

    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    })

    tileLayer.on('tileerror', () => {
      tileFailed.value = true
    })

    tileLayer.on('load', () => {
      loaded.value = true
    })

    tileLayer.addTo(map)

    setTimeout(() => {
      map.invalidateSize()
    }, 150)

    setTimeout(() => {
      if (!loaded.value) loaded.value = true
    }, 3000)

    if (!supabase) { loaded.value = true; return }
    const sb = supabase

    const loadMarkers = async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 3600000).toISOString()
        const [reqRes, healthRes, shelterRes] = await Promise.all([
          sb.from('help_requests').select('latitude,longitude,help_types').in('status', ['pending', 'in_process']).gte('created_at', cutoff).limit(100),
          sb.from('points_of_interest').select('latitude,longitude,metadata').eq('poi_type', 'health_request').eq('is_active', true).gte('created_at', cutoff).limit(50),
          sb.from('shelters').select('latitude,longitude,name').eq('status', 'active').limit(50),
        ])

        const markers: MiniMarker[] = []

        for (const r of reqRes.data ?? []) {
          if (!r.latitude || !r.longitude) continue
          const types = (r.help_types as string[]) || []
          markers.push({ lat: r.latitude, lng: r.longitude, icon: TYPE_ICONS[types[0]] || '🆘' })
        }
        for (const h of healthRes.data ?? []) {
          if (!h.latitude || !h.longitude) continue
          markers.push({ lat: h.latitude, lng: h.longitude, icon: '❤️' })
        }
        for (const s of shelterRes.data ?? []) {
          if (!s.latitude || !s.longitude) continue
          markers.push({ lat: s.latitude, lng: s.longitude, icon: '🏠' })
        }

        markerCount.value = markers.length

        for (const m of markers) {
          const icon = L.divIcon({
            className: '',
            html: `<div style="font-size:14px;text-align:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">${m.icon}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })
          L.marker([m.lat, m.lng], { icon, interactive: false }).addTo(map)
        }

        if (markers.length > 0) {
          const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]))
          map.fitBounds(bounds, { padding: [20, 20], maxZoom: 13, animate: false })
        }

        map.invalidateSize()
      } catch {}
    }

    loadMarkers()

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  return (
    <div class="px-4 mb-4">
      <div class="flex items-center justify-between mb-2.5">
        <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider flex items-center gap-2">
          <span class="text-base">🗺️</span> Mapa de situacion
        </h2>
        {markerCount.value > 0 && (
          <span class="text-[10px] text-nodo-muted">{markerCount.value} puntos activos</span>
        )}
      </div>
      <div
        class="relative rounded-2xl border border-nodo-border"
        style={{ height: '220px', overflow: 'hidden' }}
      >
        <div
          ref={mapElRef}
          style={{ width: '100%', height: '220px' }}
        />
        {!loaded.value && (
          <div
            class="absolute inset-0 flex items-center justify-center z-[500]"
            style={{ background: '#1a2332' }}
          >
            <div class="w-6 h-6 border-2 border-nodo-muted border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {tileFailed.value && (
          <div class="absolute inset-0 flex items-center justify-center z-[500]" style={{ background: '#1a2332' }}>
            <div class="text-center">
              <span class="text-2xl block mb-2">🗺️</span>
              <p class="text-xs text-nodo-muted">No se pudo cargar el mapa.</p>
              <button
                onClick={() => route('/mapa')}
                class="text-xs text-blue-400 mt-2 underline"
              >
                Abrir mapa completo
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => route('/mapa')}
          class="absolute bottom-3 right-3 text-white text-[11px] font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
          style={{ background: 'rgba(15,23,36,0.9)', border: '1px solid rgba(42,53,69,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          Abrir mapa completo
        </button>
      </div>
    </div>
  )
}
