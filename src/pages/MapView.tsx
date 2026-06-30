import { useSignal, effect } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { supabase } from '../lib/supabase'
import { MAP_COLORS, MAP_LABELS, MARKER_ICONS, DEFAULT_CENTER, DEFAULT_ZOOM, INCIDENT_TYPES, PROTECTION_TYPES, PROTECTION_STATUSES, HEALTH_REQUEST_TYPES, HEALTH_REQUEST_STATUSES, HEALTH_PRIORITIES, CAMPAIGN_TYPES, LABEL_ES, TYPE_ICONS } from '../lib/constants'
import { searchAll, type SearchResult } from '../lib/location-search'
import { mapVersion } from '../store/map-refresh'
import { Spinner } from '../components/ui/Spinner'
import type { MapMarkerData } from '../types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return `Hace ${Math.floor(hrs / 24)}d`
}

function translateType(key: string): string {
  return LABEL_ES[key] || key
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

function makeIcon(type: string, poiType?: string, protectionType?: string, status?: string, healthType?: string, priority?: string): L.DivIcon {
  if (type === 'health_request') {
    const subIcon = healthType ? (TYPE_ICONS[healthType] || '❤️') : '❤️'
    const isResolved = status === 'resolved' || status === 'closed'
    const opacity = isResolved ? 'opacity:0.45;' : ''
    const bg = PRIORITY_COLORS[priority || 'high'] || '#e11d48'
    return L.divIcon({
      className: '',
      html: `<div style="${opacity}background:${bg};width:38px;height:38px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 10px ${bg}80;cursor:pointer">${subIcon}</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -22],
    })
  }
  if (type === 'protection') {
    const subIcon = protectionType ? (TYPE_ICONS[protectionType] || '🛡️') : '🛡️'
    const isResolved = status === 'resolved' || status === 'closed'
    const opacity = isResolved ? 'opacity:0.45;' : ''
    return L.divIcon({
      className: '',
      html: `<div style="${opacity}background:#9333ea;width:38px;height:38px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 10px rgba(147,51,234,0.5);cursor:pointer">${subIcon}</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -22],
    })
  }
  const key = type === 'poi' && poiType ? poiType : type === 'person' ? 'person_found' : type
  const cfg = MARKER_ICONS[key] || { emoji: '📍', bg: '#6b7280' }
  return L.divIcon({
    className: '',
    html: `<div style="background:${cfg.bg};width:34px;height:34px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer">${cfg.emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  })
}

function getContactHref(method?: string | null, value?: string | null, phone?: string | null): string | null {
  if (method && value) {
    const clean = value.replace(/[^+0-9@a-zA-Z._-]/g, '')
    if (method === 'whatsapp') return `https://wa.me/${value.replace(/[^0-9]/g, '')}`
    if (method === 'call') return `tel:${clean}`
    if (method === 'sms') return `sms:${clean}`
    if (method === 'telegram') {
      const h = value.startsWith('@') ? value.slice(1) : value
      return /^\+?\d/.test(value) ? `https://t.me/+${value.replace(/[^0-9]/g, '')}` : `https://t.me/${h}`
    }
    if (method === 'instagram') {
      const h = value.startsWith('@') ? value.slice(1) : value
      return `https://instagram.com/${h}`
    }
    if (method === 'email') return `mailto:${value}`
    return `tel:${clean}`
  }
  if (phone) return `tel:${phone.replace(/[^+0-9*#]/g, '')}`
  return null
}

function getContactLabel(method?: string | null): string {
  if (method === 'whatsapp') return '💬 WhatsApp'
  if (method === 'telegram') return '✈️ Telegram'
  if (method === 'instagram') return '📷 Instagram'
  if (method === 'email') return '📧 Correo'
  if (method === 'sms') return '💬 SMS'
  return '📞 Contactar'
}

function buildPopup(m: MapMarkerData): string {
  const lat = m.latitude
  const lng = m.longitude
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`

  let header = ''
  if (m.type === 'help_request') header = '🆘 Necesita ayuda con'
  else if (m.type === 'help_offer') header = '🤝 Disponible para ayudar en'
  else if (m.type === 'person') header = '👤 Persona localizada'
  else if (m.type === 'incident') {
    const it = INCIDENT_TYPES.find(t => t.value === m.incident_type)
    header = it ? `${it.icon} ${it.label}` : '⚠️ Incidente'
  } else if (m.type === 'protection') {
    const pt = PROTECTION_TYPES.find(t => t.value === m.protection_type)
    header = pt ? `${pt.icon} ${pt.label}` : '🛡️ Proteccion y rescate'
  } else if (m.type === 'health_request') {
    const ht = HEALTH_REQUEST_TYPES.find(t => t.value === m.health_type)
    header = ht ? `${ht.icon} ${ht.label}` : '❤️ Solicitud de salud'
  } else if (m.type === 'shelter') header = '🏠 Refugio'
  else header = '📍 Punto de interes'

  const statusLabel = translateType(m.status)
  const name = m.reporter_name || 'Usuario anonimo'
  const location = m.subtitle || ''
  const time = m.created_at ? timeAgo(m.created_at) : ''

  let html = `<div style="color:#111;min-width:220px;max-width:280px;font-family:system-ui,sans-serif;line-height:1.4">`

  html += `<div style="font-weight:700;font-size:13px;color:#333;margin-bottom:6px">${header}</div>`

  if (m.cover_image) {
    html += `<img src="${m.cover_image}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px" alt="" />`
  }

  if (m.help_types && m.help_types.length > 0) {
    html += `<div style="margin-bottom:6px;display:flex;flex-wrap:wrap;gap:4px">`
    m.help_types.forEach(t => {
      const icon = TYPE_ICONS[t] || '📋'
      const label = translateType(t)
      html += `<span style="background:#f3f4f6;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:500;color:#333">${icon} ${esc(label)}</span>`
    })
    html += `</div>`
  }

  if (m.type === 'person' || m.type === 'shelter' || m.type === 'poi' || m.type === 'protection' || m.type === 'health_request') {
    html += `<div style="font-weight:700;font-size:14px;margin-bottom:4px">${esc(m.title)}</div>`
  }

  if (m.type === 'protection') {
    if (m.observed_state && m.observed_state !== 'unknown') {
      html += `<div style="font-size:12px;color:#555;margin-bottom:4px">👁️ Estado: ${esc(translateType(m.observed_state))}</div>`
    }
    if (m.subject_count && m.subject_count > 1) {
      html += `<div style="font-size:12px;color:#555;margin-bottom:4px">👥 Cantidad: ${m.subject_count}</div>`
    }
  }

  if (m.type === 'health_request') {
    if (m.hospital_name) {
      html += `<div style="font-size:12px;color:#555;margin-bottom:4px">🏥 ${esc(m.hospital_name)}</div>`
    }
    if (m.blood_type && m.blood_type !== 'not_applicable') {
      html += `<div style="font-size:12px;margin-bottom:4px"><span style="background:#fecdd3;color:#be123c;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700">🩸 ${esc(m.blood_type)}</span></div>`
    }
    if (m.donor_count) {
      const confirmed = m.donors_confirmed || 0
      const complete = confirmed >= m.donor_count
      if (complete) {
        html += `<div style="font-size:12px;margin-bottom:4px"><span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">🟢 Donantes completos (${confirmed}/${m.donor_count})</span></div>`
      } else {
        const pct = Math.min(100, Math.round((confirmed / m.donor_count) * 100))
        html += `<div style="font-size:12px;color:#555;margin-bottom:4px">👥 Donantes: ${confirmed}/${m.donor_count}</div>`
        html += `<div style="width:100%;height:6px;border-radius:3px;background:#f3f4f6;margin-bottom:4px;overflow:hidden"><div style="width:${pct}%;height:100%;border-radius:3px;background:#3b82f6;transition:width 0.3s"></div></div>`
      }
    }
    if (m.request_date) {
      const dateStr = m.request_date + (m.request_time ? ` ${m.request_time}` : '')
      html += `<div style="font-size:12px;color:#555;margin-bottom:4px">📅 ${esc(dateStr)}</div>`
    }
  }

  if (m.description) {
    html += `<div style="font-size:12px;color:#555;margin-bottom:6px">📝 ${esc(m.description)}</div>`
  }

  if (m.type !== 'person') {
    html += `<div style="font-size:12px;color:#444;margin-bottom:3px">👤 ${esc(name)}</div>`
  }

  if (location) {
    html += `<div style="font-size:12px;color:#666;margin-bottom:3px">📍 ${esc(location)}</div>`
  }

  html += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:11px;color:#888">`
  if (time) html += `<span>🕒 ${time}</span>`

  if (m.type === 'protection') {
    const ps = PROTECTION_STATUSES.find(s => s.value === m.status) || PROTECTION_STATUSES[0]
    html += `<span style="background:${ps.color}22;border:1px solid ${ps.color};padding:1px 7px;border-radius:10px;font-size:10px;font-weight:600;color:${ps.color}">${ps.emoji} ${esc(ps.label)}</span>`
  } else if (m.type === 'health_request') {
    const hs = HEALTH_REQUEST_STATUSES.find(s => s.value === m.status) || HEALTH_REQUEST_STATUSES[0]
    html += `<span style="background:${hs.color}22;border:1px solid ${hs.color};padding:1px 7px;border-radius:10px;font-size:10px;font-weight:600;color:${hs.color}">${hs.emoji} ${esc(hs.label)}</span>`
    if (m.priority) {
      const hp = HEALTH_PRIORITIES.find(p => p.value === m.priority) || HEALTH_PRIORITIES[1]
      html += `<span style="background:${hp.color}22;border:1px solid ${hp.color};padding:1px 7px;border-radius:10px;font-size:10px;font-weight:600;color:${hp.color}">${hp.emoji} ${esc(hp.label)}</span>`
    }
  } else {
    html += `<span style="background:#e5e7eb;padding:1px 7px;border-radius:10px;font-size:10px;font-weight:600;color:#555">${esc(statusLabel)}</span>`
  }
  html += `</div>`

  if (m.type === 'protection') {
    html += `<div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:6px 8px;margin-bottom:8px">`
    html += `<div style="font-size:11px;color:#92400e;font-weight:600">⚠️ Reporte ciudadano</div>`
    html += `<div style="font-size:10px;color:#a16207">Pendiente de verificacion.</div>`
    html += `</div>`

    if (m.updates && m.updates.length > 0) {
      html += `<div style="margin-bottom:8px">`
      html += `<div style="font-size:11px;font-weight:700;color:#333;margin-bottom:4px">📋 Actualizaciones</div>`
      m.updates.forEach(u => {
        const t = timeAgo(u.timestamp)
        html += `<div style="font-size:11px;color:#555;padding:3px 0;border-bottom:1px solid #f3f4f6" data-update-ts="${esc(u.timestamp)}" data-update-poi="${m.id}">`
        html += `<span style="color:#888">${t}</span> — ${esc(u.text)}`
        html += `</div>`
      })
      html += `</div>`
    }

    html += `<div data-update-wrapper>`
    html += `<button data-action="add-update" data-id="${m.id}" style="width:100%;text-align:center;color:white;padding:6px 4px;border-radius:8px;font-size:11px;font-weight:600;border:none;cursor:pointer;background:#7c3aed;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:4px">✅ Tengo informacion</button>`
    html += `</div>`
  }

  const btnBase = 'text-align:center;color:white;padding:6px 4px;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;border:none;cursor:pointer;flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:2px'

  if (m.type === 'health_request' && m.contact_whatsapp) {
    const waNum = m.contact_whatsapp.replace(/\D/g, '')
    html += `<div style="margin-bottom:4px"><a href="https://wa.me/${waNum}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;background:#25d366;color:white;padding:8px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;border:none;cursor:pointer">📱 Contactar por WhatsApp</a></div>`
  }

  html += `<div style="display:flex;gap:3px;margin-bottom:3px">`
  html += `<a href="${mapsUrl}" target="_blank" rel="noopener" style="${btnBase};background:#2563eb">📍 Como llegar</a>`
  const contactHref = getContactHref(m.contact_method, m.contact_value, m.phone)
  if (contactHref) {
    const isExternal = contactHref.startsWith('http')
    html += `<a href="${contactHref}" ${isExternal ? 'target="_blank" rel="noopener"' : ''} style="${btnBase};background:#16a34a">${getContactLabel(m.contact_method)}</a>`
  }
  html += `</div>`

  html += `<div style="display:flex;gap:3px;margin-bottom:3px">`
  html += `<button data-action="share" data-text="${esc(m.title)}" data-url="${mapsLink}" style="${btnBase};background:#6366f1">📤 Compartir</button>`
  html += `<button data-action="copy-location" data-url="${mapsLink}" style="${btnBase};background:#4b5563">📍 Copiar</button>`
  html += `</div>`

  if (m.type === 'protection' && m.table_name) {
    html += `<div data-attend-wrapper>`
    html += `<button data-action="change-protection-status" data-id="${m.id}" style="width:100%;${btnBase};background:#ea580c;margin-top:2px">🔄 Cambiar estado</button>`
    html += `</div>`
  } else if (m.table_name && m.status !== 'attended' && m.status !== 'resolved') {
    html += `<div data-attend-wrapper>`
    html += `<button data-action="attend" data-table="${m.table_name}" data-id="${m.id}" style="width:100%;${btnBase};background:#ea580c;margin-top:2px">✅ Marcar como atendido</button>`
    html += `</div>`
  }

  html += `</div>`
  return html
}

const HOUR_MS = 3600000

export function MapView() {
  const { route } = useLocation()
  const activeTab = useSignal<'centros' | 'daños'>('centros')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerLayer = useRef<L.LayerGroup | null>(null)
  const searchMarker = useRef<L.Marker | null>(null)
  const markers = useSignal<MapMarkerData[]>([])
  const loading = useSignal(true)
  const activeLayers = useSignal<Set<string>>(new Set(Object.keys(MAP_COLORS)))
  const showFilters = useSignal(false)
  const helpTypeFilter = useSignal<string | null>(null)
  const lastVersion = useRef(mapVersion.value)

  // Search state
  const searchQuery = useSignal('')
  const searchResults = useSignal<SearchResult[]>([])
  const searchOpen = useSignal(false)
  const searching = useSignal(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchPinPos = useSignal<{ lat: number; lng: number } | null>(null)
  const searchPinTitle = useSignal('')

  // Damage map state (for StatusVzla widget)
  const damageLoading = useSignal(false)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const params = new URLSearchParams(window.location.search)
    const htParam = params.get('helpType')
    if (htParam) helpTypeFilter.value = htParam

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const lg = L.layerGroup().addTo(map)
    markerLayer.current = lg
    mapInstance.current = map

    loadMapData(map)

    const poll = setInterval(() => {
      if (mapVersion.value !== lastVersion.current) {
        lastVersion.current = mapVersion.value
        loadMapData(map)
      }
    }, 3000)

    const refresh = setInterval(() => loadMapData(map), 30000)

    return () => {
      clearInterval(poll)
      clearInterval(refresh)
      map.remove()
      mapInstance.current = null
      markerLayer.current = null
    }
  }, [])

  effect(() => {
    if (activeTab.value === 'centros' && mapInstance.current) {
      setTimeout(() => {
        mapInstance.current?.invalidateSize()
        mapInstance.current?.fitBounds(mapInstance.current.getBounds())
      }, 100)
    }
  })


  useEffect(() => {
    if (activeTab.value !== 'daños') return

    const mapContainer = document.getElementById('svzla-map')
    if (!mapContainer) return

    const loadWidget = () => {
      fetch('https://statusvzla.com/functions/apiMapa?format=geojson')
        .then(r => r.json())
        .then(data => {
          const mapContainer = document.getElementById('svzla-map')
          if (!mapContainer) return

          const map = L.map('svzla-map').setView([10.48, -66.90], 8)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

          const colores: Record<string, string> = {
            leve: '#D97706',
            moderado: '#EA580C',
            grave: '#DC2626',
            critico: '#991B1B',
            colapsado: '#450A0A',
            no_evaluado: '#6B7280',
          }

          const htmlEsc = (s: string = '') => String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
          }[c] || c))

          const getSafeUrl = (url: string) => {
            try {
              const u = new URL(url)
              if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
            } catch {}
            return '#'
          }

          L.geoJSON(data, {
            pointToLayer: (f: any, latlng: any) => {
              const c = colores[f.properties.nivel_dano] || '#6B7280'
              return L.circleMarker(latlng, { radius: 7, fillColor: c, color: '#fff', weight: 1, fillOpacity: 0.9 })
            },
            onEachFeature: (f: any, layer: any) => {
              const p = f.properties
              const safeUrl = getSafeUrl(p.url || '')
              layer.bindPopup(`<b>${htmlEsc(p.nombre || 'Sin nombre')}</b><br>Daño: ${htmlEsc(p.nivel_dano)}<br><a href="${htmlEsc(safeUrl)}" target="_blank" rel="noopener noreferrer">Ver detalle ↗</a>`)
            },
          }).addTo(map)
        })
        .catch(err => console.error('Error loading StatusVzla widget:', err))
    }

    loadWidget()
  }, [activeTab.value])

  async function loadMapData(map: L.Map) {
    loading.value = true
    const allMarkers: MapMarkerData[] = []

    if (supabase) {
      try {
        const cutoff24h = new Date(Date.now() - 24 * HOUR_MS).toISOString()
        const cutoff72h = new Date(Date.now() - 72 * HOUR_MS).toISOString()

        const [helpRes, offersRes, personsRes, sheltersRes, poiRes, poiVerifiedRes] = await Promise.all([
          supabase.from('help_requests').select('*').neq('status', 'closed').gte('created_at', cutoff24h).limit(500),
          supabase.from('help_offers').select('*').neq('status', 'closed').gte('created_at', cutoff24h).limit(500),
          supabase.from('persons').select('*').gte('created_at', cutoff72h).limit(500),
          supabase.from('shelters').select('*').eq('status', 'active').limit(200),
          supabase.from('points_of_interest').select('*').eq('is_active', true).eq('verified', false).gte('created_at', cutoff24h).limit(500),
          supabase.from('points_of_interest').select('*').eq('is_active', true).eq('verified', true).limit(200),
        ])

        helpRes.data?.forEach((r: Record<string, unknown>) => {
          if (r.latitude && r.longitude) {
            const types = (r.help_types as string[]) || []
            const translated = types.map(t => translateType(t)).join(', ') || 'Ayuda general'
            allMarkers.push({
              id: r.id as string, type: 'help_request',
              latitude: r.latitude as number, longitude: r.longitude as number,
              title: translated,
              subtitle: [r.sector, r.city].filter(Boolean).join(' · ') as string || null,
              description: r.description as string | null,
              status: r.status as string,
              urgency: r.urgency as MapMarkerData['urgency'],
              reporter_name: (r.reporter_name as string | null) || null,
              help_types: types,
              contact_method: r.contact_method as string | null,
              contact_value: r.contact_value as string | null,
              created_at: r.created_at as string,
              table_name: 'help_requests',
              cover_image: (((r.metadata as Record<string, unknown>)?.images as string[]) || [])[0] || null,
            })
          }
        })

        offersRes.data?.forEach((r: Record<string, unknown>) => {
          if (r.latitude && r.longitude) {
            const types = (r.offer_types as string[]) || []
            const translated = types.map(t => translateType(t)).join(', ') || 'Ayuda'
            allMarkers.push({
              id: r.id as string, type: 'help_offer',
              latitude: r.latitude as number, longitude: r.longitude as number,
              title: translated,
              subtitle: [r.sector, r.city].filter(Boolean).join(' · ') as string || null,
              description: r.description as string | null,
              status: r.status as string,
              reporter_name: (r.reporter_name as string | null) || null,
              help_types: types,
              contact_method: r.contact_method as string | null,
              contact_value: r.contact_value as string | null,
              created_at: r.created_at as string,
              table_name: 'help_offers',
              cover_image: (((r.metadata as Record<string, unknown>)?.images as string[]) || [])[0] || null,
            })
          }
        })

        personsRes.data?.forEach((p: Record<string, unknown>) => {
          if (p.last_known_lat && p.last_known_lng) {
            const personName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
            allMarkers.push({
              id: p.id as string, type: 'person',
              latitude: p.last_known_lat as number, longitude: p.last_known_lng as number,
              title: personName || 'Persona',
              subtitle: [p.sector, p.city].filter(Boolean).join(' · ') as string || null,
              description: p.description as string | null,
              status: p.current_status as string,
              reporter_name: personName || null,
              contact_method: p.contact_method as string | null,
              contact_value: p.contact_value as string | null,
              created_at: p.created_at as string,
              table_name: 'persons',
              cover_image: (((p.metadata as Record<string, unknown>)?.images as string[]) || [])[0] || null,
            })
          }
        })

        sheltersRes.data?.forEach((s: Record<string, unknown>) => {
          if (s.latitude && s.longitude) {
            const meta = (s.metadata || {}) as Record<string, unknown>
            const imgs = (meta.images || []) as string[]
            allMarkers.push({
              id: s.id as string, type: 'shelter',
              latitude: s.latitude as number, longitude: s.longitude as number,
              title: s.name as string,
              subtitle: `Capacidad: ${s.capacity || '?'}`,
              description: s.notes as string | null,
              status: s.status as string,
              created_at: s.created_at as string,
              table_name: 'shelters',
              cover_image: imgs[0] || null,
            })
          }
        })

        const allPois = [...(poiRes.data || []), ...(poiVerifiedRes.data || [])] as Record<string, unknown>[]
        const seenPoiIds = new Set<string>()
        allPois.forEach((p) => {
          const poiId = p.id as string
          if (seenPoiIds.has(poiId)) return
          seenPoiIds.add(poiId)
          if (p.latitude && p.longitude) {
            const meta = (p.metadata || {}) as Record<string, unknown>
            const isIncident = p.poi_type === 'incident'
            const isProtection = p.poi_type === 'protection'
            const isHealth = p.poi_type === 'health_request'
            allMarkers.push({
              id: p.id as string,
              type: isHealth ? 'health_request' : isProtection ? 'protection' : isIncident ? 'incident' : 'poi',
              latitude: p.latitude as number, longitude: p.longitude as number,
              title: p.name as string,
              subtitle: [p.sector, p.city].filter(Boolean).join(' · ') as string || null,
              description: p.description as string | null,
              status: (meta.status as string) || 'active',
              poi_type: p.poi_type as MapMarkerData['poi_type'],
              incident_type: meta.incident_type as MapMarkerData['incident_type'],
              protection_type: meta.protection_type as MapMarkerData['protection_type'],
              urgency: meta.urgency as MapMarkerData['urgency'],
              reporter_name: (meta.reporter_name as string | null) || null,
              contact_method: meta.contact_method as string | null,
              contact_value: meta.contact_value as string | null,
              created_at: p.created_at as string,
              table_name: 'points_of_interest',
              observed_state: (meta.observed_state as string | null) || null,
              subject_count: (meta.subject_count as number | null) || null,
              updates: (meta.updates as MapMarkerData['updates']) || null,
              health_type: meta.health_type as MapMarkerData['health_type'],
              blood_type: meta.blood_type as MapMarkerData['blood_type'],
              hospital_name: (meta.hospital_name as string | null) || null,
              contact_whatsapp: (meta.contact_whatsapp as string | null) || null,
              donor_count: (meta.donor_count as number | null) || null,
              donors_confirmed: (meta.donors_confirmed as number | null) || null,
              request_date: (meta.request_date as string | null) || null,
              request_time: (meta.request_time as string | null) || null,
              priority: meta.priority as MapMarkerData['priority'],
              cover_image: ((meta.images as string[]) || [])[0] || null,
            })
          }
        })
      } catch {
        // Continue with cached markers
      }
    }

    try {
      const campRes = await supabase!.from('official_campaigns').select('id,title,campaign_type,organization,locations,opening_hours,verification_level,created_at').eq('status', 'active').limit(50)
      if (campRes.data) {
        for (const c of campRes.data) {
          const locs = (c.locations as Array<{ name: string; lat?: number; lng?: number; address?: string }>) || []
          const ct = CAMPAIGN_TYPES.find(t => t.value === c.campaign_type)
          for (const loc of locs) {
            if (!loc.lat || !loc.lng) continue
            allMarkers.push({
              id: `camp_${c.id}_${loc.name}`,
              type: 'poi',
              poi_type: undefined,
              latitude: loc.lat,
              longitude: loc.lng,
              title: c.title as string,
              subtitle: loc.name,
              description: `${ct?.label || 'Campana'} · ${c.organization || ''}`.trim(),
              status: 'active',
              created_at: c.created_at as string,
              reporter_name: c.organization as string | null,
              table_name: undefined,
            })
          }
        }
      }
    } catch { }

    markers.value = allMarkers
    renderMarkers(map, allMarkers, activeLayers.value, helpTypeFilter.value)
    loading.value = false
  }

  function renderMarkers(map: L.Map, data: MapMarkerData[], layers: Set<string>, typeFilter: string | null = null) {
    if (!markerLayer.current) return
    markerLayer.current.clearLayers()

    data.forEach((m) => {
      if (typeFilter) {
        if (m.type !== 'help_request') return
        if (!m.help_types?.includes(typeFilter)) return
      }

      const layerKey = m.type === 'protection'
        ? 'protection'
        : m.type === 'health_request'
          ? 'health_request'
          : m.type === 'poi' && m.poi_type
            ? m.poi_type
            : m.type === 'person' ? 'person_found' : m.type

      if (!layers.has(layerKey)) return

      const icon = makeIcon(m.type, m.poi_type, m.protection_type, m.status, m.health_type, m.priority)
      const marker = L.marker([m.latitude, m.longitude], { icon })
        .bindPopup(buildPopup(m), { maxWidth: 300, className: 'nodo-popup' })

      marker.on('popupopen', () => {
        const popup = marker.getPopup()
        if (!popup) return
        const container = popup.getElement()
        if (!container) return

        // --- "Tengo información" handler for protection reports ---
        const updateWrapper = container.querySelector('[data-update-wrapper]') as HTMLElement | null
        const addUpdateBtn = container.querySelector('[data-action="add-update"]') as HTMLButtonElement | null
        if (addUpdateBtn && updateWrapper) {
          addUpdateBtn.addEventListener('click', () => {
            const poiId = addUpdateBtn.dataset.id!
            const inputStyle = 'width:100%;background:#f9fafb;border:1px solid #d1d5db;border-radius:8px;padding:8px;font-size:12px;color:#111;resize:none;min-height:50px;font-family:system-ui,sans-serif'
            const btnStyle = 'text-align:center;color:white;padding:6px 4px;border-radius:8px;font-size:11px;font-weight:600;border:none;cursor:pointer;flex:1'
            updateWrapper.innerHTML = `
              <textarea data-update-text placeholder="Ej: Ya fue rescatado, la mascota aparecio..." style="${inputStyle}"></textarea>
              <div style="display:flex;gap:4px;margin-top:4px">
                <button data-cancel-update style="${btnStyle};background:#6b7280">Cancelar</button>
                <button data-send-update data-id="${poiId}" style="${btnStyle};background:#7c3aed">Enviar</button>
              </div>
            `
            const textarea = updateWrapper.querySelector('[data-update-text]') as HTMLTextAreaElement
            textarea?.focus()

            updateWrapper.querySelector('[data-cancel-update]')?.addEventListener('click', () => {
              updateWrapper.innerHTML = `<button data-action="add-update" data-id="${poiId}" style="width:100%;text-align:center;color:white;padding:6px 4px;border-radius:8px;font-size:11px;font-weight:600;border:none;cursor:pointer;background:#7c3aed;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:4px">✅ Tengo informacion</button>`
              const newBtn = updateWrapper.querySelector('[data-action="add-update"]') as HTMLButtonElement
              if (newBtn) newBtn.addEventListener('click', () => addUpdateBtn.click())
            })

            updateWrapper.querySelector('[data-send-update]')?.addEventListener('click', async () => {
              const text = textarea?.value?.trim()
              if (!text || !supabase) return
              const sendBtn = updateWrapper.querySelector('[data-send-update]') as HTMLButtonElement
              sendBtn.textContent = '...'
              sendBtn.disabled = true
              try {
                const { data: poi } = await supabase.from('points_of_interest').select('metadata').eq('id', poiId).single()
                const meta = (poi?.metadata || {}) as Record<string, unknown>
                const updates = (meta.updates || []) as Array<Record<string, unknown>>
                updates.push({ text, timestamp: new Date().toISOString(), device_id: null })
                await supabase.from('points_of_interest').update({ metadata: { ...meta, updates } }).eq('id', poiId)
                updateWrapper.innerHTML = `<p style="font-size:12px;color:#7c3aed;text-align:center;font-weight:600;margin:4px 0">✅ Informacion enviada</p>`
                setTimeout(() => loadMapData(map), 1500)
              } catch {
                sendBtn.textContent = 'Error'
                sendBtn.disabled = false
              }
            })
          })
        }

        // --- Status change handler for protection reports ---
        const statusBtn = container.querySelector('[data-action="change-protection-status"]') as HTMLButtonElement | null
        const attendWrapper = container.querySelector('[data-attend-wrapper]') as HTMLElement | null
        if (statusBtn && attendWrapper) {
          statusBtn.addEventListener('click', () => {
            const poiId = statusBtn.dataset.id!
            const btnStyle = 'width:100%;text-align:center;color:white;padding:6px 4px;border-radius:8px;font-size:11px;font-weight:600;border:none;cursor:pointer;margin-bottom:3px;display:flex;align-items:center;justify-content:center;gap:4px'
            let statusHtml = ''
            PROTECTION_STATUSES.forEach(s => {
              statusHtml += `<button data-set-status="${s.value}" data-poi-id="${poiId}" style="${btnStyle};background:${s.color}">${s.emoji} ${s.label}</button>`
            })
            attendWrapper.innerHTML = statusHtml
            attendWrapper.querySelectorAll('[data-set-status]').forEach(btn => {
              btn.addEventListener('click', async () => {
                if (!supabase) return
                const target = btn as HTMLButtonElement
                const newStatus = target.dataset.setStatus!
                const id = target.dataset.poiId!
                target.textContent = '...'
                target.disabled = true
                try {
                  const { data: poi } = await supabase.from('points_of_interest').select('metadata').eq('id', id).single()
                  const meta = (poi?.metadata || {}) as Record<string, unknown>
                  await supabase.from('points_of_interest').update({ metadata: { ...meta, status: newStatus } }).eq('id', id)
                  attendWrapper.innerHTML = `<p style="font-size:12px;color:#16a34a;text-align:center;font-weight:600;margin:4px 0">✅ Estado actualizado</p>`
                  setTimeout(() => loadMapData(map), 1500)
                } catch {
                  target.textContent = 'Error'
                  target.disabled = false
                }
              })
            })
          })
        }

        // --- "Marcar como atendido" for non-protection POIs ---
        const attendBtn = container.querySelector('[data-action="attend"]') as HTMLButtonElement | null
        if (attendBtn && attendWrapper) {
          attendBtn.addEventListener('click', () => {
            const table = attendBtn.dataset.table!
            const id = attendBtn.dataset.id!
            const confirmBtnStyle = 'text-align:center;color:white;padding:6px 4px;border-radius:8px;font-size:11px;font-weight:600;border:none;cursor:pointer;flex:1'
            attendWrapper.innerHTML = `
              <p style="font-size:11px;color:#666;text-align:center;margin:4px 0 4px 0">Esta accion ocultara el reporte para otros usuarios.</p>
              <div style="display:flex;gap:4px">
                <button data-confirm="cancel" style="${confirmBtnStyle};background:#6b7280">Cancelar</button>
                <button data-confirm="yes" style="${confirmBtnStyle};background:#16a34a">Si, atendido</button>
              </div>
            `
            const cancelBtn = attendWrapper.querySelector('[data-confirm="cancel"]') as HTMLButtonElement
            const yesBtn = attendWrapper.querySelector('[data-confirm="yes"]') as HTMLButtonElement

            cancelBtn.addEventListener('click', () => {
              const restoreBtnStyle = 'width:100%;text-align:center;color:white;padding:6px 4px;border-radius:8px;font-size:11px;font-weight:600;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:2px;background:#ea580c;margin-top:2px'
              attendWrapper.innerHTML = `<button data-action="attend-retry" data-table="${table}" data-id="${id}" style="${restoreBtnStyle}">✅ Marcar como atendido</button>`
              const retryBtn = attendWrapper.querySelector('[data-action="attend-retry"]') as HTMLButtonElement
              retryBtn.addEventListener('click', () => {
                attendBtn.dataset.table = table
                attendBtn.dataset.id = id
                attendBtn.click()
              })
            })

            yesBtn.addEventListener('click', async () => {
              if (!supabase) return
              yesBtn.textContent = '...'
              yesBtn.disabled = true
              cancelBtn.disabled = true
              try {
                if (table === 'points_of_interest') {
                  const { data: poi } = await supabase.from(table).select('metadata').eq('id', id).single()
                  const meta = (poi?.metadata || {}) as Record<string, unknown>
                  await supabase.from(table).update({ metadata: { ...meta, status: 'resolved' } }).eq('id', id)
                } else {
                  await supabase.from(table).update({ status: 'attended' }).eq('id', id)
                }
                attendWrapper.innerHTML = `<p style="font-size:12px;color:#16a34a;text-align:center;font-weight:600;margin:4px 0">✅ Marcado como atendido</p>`
                setTimeout(() => loadMapData(map), 1500)
              } catch {
                yesBtn.textContent = 'Error'
                yesBtn.disabled = false
                cancelBtn.disabled = false
              }
            })
          })
        }

        const shareBtn = container.querySelector('[data-action="share"]') as HTMLButtonElement | null
        if (shareBtn) {
          shareBtn.addEventListener('click', async () => {
            const title = shareBtn.dataset.text || ''
            const url = shareBtn.dataset.url || ''
            const text = `🚨 ${title}\n📍 ${url}\n\nVisto en NODO: https://nodoayuda.com`
            if (navigator.share) {
              try { await navigator.share({ title: 'Reporte NODO', text, url }) } catch { /* cancelled */ }
            } else {
              try {
                await navigator.clipboard.writeText(text)
                shareBtn.textContent = '✅ Copiado'
                setTimeout(() => { shareBtn.textContent = '📤 Compartir' }, 2000)
              } catch { /* fallback */ }
            }
          })
        }

        const copyBtn = container.querySelector('[data-action="copy-location"]') as HTMLButtonElement | null
        if (copyBtn) {
          copyBtn.addEventListener('click', async () => {
            const url = copyBtn.dataset.url || ''
            try {
              await navigator.clipboard.writeText(url)
              copyBtn.textContent = '✅ Copiado'
              setTimeout(() => { copyBtn.textContent = '📍 Copiar' }, 2000)
            } catch { /* fallback */ }
          })
        }
      })

      markerLayer.current!.addLayer(marker)
    })
  }

  // --- Search logic (uses shared module) ---

  const handleSearchInput = (value: string) => {
    searchQuery.value = value
    if (searchTimer.current) clearTimeout(searchTimer.current)

    if (value.trim().length < 2) {
      searchResults.value = []
      searchOpen.value = false
      return
    }

    searchTimer.current = setTimeout(async () => {
      searching.value = true
      searchOpen.value = true
      const results = await searchAll(value)
      searchResults.value = results
      searching.value = false
    }, 350)
  }

  const selectResult = (result: SearchResult) => {
    const map = mapInstance.current
    if (!map) return

    searchOpen.value = false
    searchQuery.value = result.title
    inputRef.current?.blur()

    if (searchMarker.current) {
      map.removeLayer(searchMarker.current)
      searchMarker.current = null
    }
    searchPinPos.value = null

    map.flyTo([result.lat, result.lng], 16, { duration: 1.2 })

    if (result.source === 'nodo') {
      setTimeout(() => {
        if (!markerLayer.current) return
        markerLayer.current.eachLayer((layer) => {
          const lm = layer as L.Marker
          const pos = lm.getLatLng()
          if (Math.abs(pos.lat - result.lat) < 0.0001 && Math.abs(pos.lng - result.lng) < 0.0001) {
            lm.openPopup()
          }
        })
      }, 1300)
    } else {
      searchPinTitle.value = result.title

      const icon = L.divIcon({
        className: '',
        html: '<div style="font-size:40px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));text-align:center;line-height:1">📍</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      })

      setTimeout(() => {
        const sm = L.marker([result.lat, result.lng], { icon, draggable: true }).addTo(map)
        sm.on('dragend', () => {
          const ll = sm.getLatLng()
          searchPinPos.value = { lat: ll.lat, lng: ll.lng }
        })
        searchMarker.current = sm
        searchPinPos.value = { lat: result.lat, lng: result.lng }
      }, 1300)
    }
  }

  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchOpen.value = false
    searchPinPos.value = null
    searchPinTitle.value = ''
    if (searchMarker.current && mapInstance.current) {
      mapInstance.current.removeLayer(searchMarker.current)
      searchMarker.current = null
    }
  }

  const toggleLayer = (key: string) => {
    const s = new Set(activeLayers.value)
    if (s.has(key)) s.delete(key)
    else s.add(key)
    activeLayers.value = s
    if (mapInstance.current) {
      renderMarkers(mapInstance.current, markers.value, s, helpTypeFilter.value)
    }
  }

  const clearFilter = () => {
    helpTypeFilter.value = null
    history.replaceState(null, '', '/mapa')
    if (mapInstance.current) {
      renderMarkers(mapInstance.current, markers.value, activeLayers.value, null)
    }
  }

  const handleRefresh = () => {
    if (mapInstance.current) loadMapData(mapInstance.current)
  }


  return (
    <div style="position:relative;height:calc(100vh - 120px);overflow:hidden">
      {/* Tabs */}
      <div style="position:absolute;top:0;left:0;right:0;z-index:9998;background:rgba(15,23,41,0.95);border-bottom:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;height:48px">
        <button
          onClick={() => { activeTab.value = 'centros' }}
          style={`flex:1;padding:12px 16px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;${activeTab.value === 'centros' ? 'color:#3b82f6;border-bottom:2px solid #3b82f6' : 'color:#9ca3af;border-bottom:2px solid transparent'}`}
        >
          🏢 Centros de acopio
        </button>
        <button
          onClick={() => { activeTab.value = 'daños' }}
          style={`flex:1;padding:12px 16px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;${activeTab.value === 'daños' ? 'color:#ef4444;border-bottom:2px solid #ef4444' : 'color:#9ca3af;border-bottom:2px solid transparent'}`}
        >
          ⚠️ Daños
        </button>
      </div>

      {/* Centros de acopio tab */}
      <div style={`position:absolute;top:48px;left:0;right:0;bottom:0;overflow:hidden;display:${activeTab.value === 'centros' ? 'block' : 'none'}`}>
        {/* Map fills entire container */}
        <div ref={mapRef} style="position:absolute;top:0;left:0;right:0;bottom:0" />

        {/* Search bar - floats above map */}
        <div style="position:absolute;top:12px;left:12px;right:12px;z-index:10000">
          <div style="display:flex;gap:8px">
            {/* Back button */}
            <button
              style="width:44px;height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.92);border-radius:12px;border:1px solid rgba(255,255,255,0.08);color:white;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)"
              aria-label="Volver"
              onClick={() => route('/')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>

            {/* Search input */}
            <div style="flex:1;position:relative">
              <div style="display:flex;align-items:center;background:rgba(15,23,41,0.92);border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
                <span style="padding-left:12px;font-size:16px;flex-shrink:0">🔍</span>
                <input
                  ref={inputRef}
                  type="search"
                  style="flex:1;background:transparent;color:white;font-size:14px;padding:12px 8px;outline:none;border:none;min-width:0"
                  placeholder="Buscar direccion, refugio, hospital..."
                  value={searchQuery.value}
                  onInput={(e) => handleSearchInput((e.target as HTMLInputElement).value)}
                  onFocus={() => { if (searchResults.value.length > 0) searchOpen.value = true }}
                  autoComplete="off"
                  enterKeyHint="search"
                />
                {searchQuery.value && (
                  <button style="padding:0 12px 0 4px;color:#9ca3af;font-size:16px;background:none;border:none;cursor:pointer" onClick={clearSearch} aria-label="Limpiar">✕</button>
                )}
              </div>

              {/* Results dropdown */}
              {searchOpen.value && searchResults.value.length > 0 && (
                <div style="position:absolute;top:100%;left:0;right:0;margin-top:6px;background:rgba(15,23,41,0.96);border:1px solid rgba(255,255,255,0.08);border-radius:12px;max-height:60vh;overflow-y:auto;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
                  {searchResults.value.map((r, i) => {
                    const isFirst = i === 0
                    const prevSource = i > 0 ? searchResults.value[i - 1].source : null
                    const showDivider = r.source === 'nominatim' && prevSource === 'nodo'
                    return (
                      <div key={r.id}>
                        {showDivider && (
                          <div style="padding:6px 12px;font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-top:1px solid rgba(255,255,255,0.06)">
                            Otros lugares
                          </div>
                        )}
                        {isFirst && r.source === 'nodo' && (
                          <div style="padding:6px 12px;font-size:10px;color:#34d399;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
                            En NODO
                          </div>
                        )}
                        {isFirst && r.source === 'nominatim' && (
                          <div style="padding:6px 12px;font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
                            Otros lugares
                          </div>
                        )}
                        <button
                          style="width:100%;padding:10px 12px;display:flex;align-items:center;gap:10px;text-align:left;background:none;border:none;cursor:pointer;color:white"
                          onClick={() => selectResult(r)}
                        >
                          <span style="font-size:18px;flex-shrink:0;width:28px;text-align:center">{r.icon}</span>
                          <div style="flex:1;min-width:0;overflow:hidden">
                            <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{r.title}</div>
                            <div style="font-size:11px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{r.subtitle}</div>
                          </div>
                          {r.source === 'nodo' && (
                            <span style="font-size:9px;background:rgba(6,78,59,0.6);color:#34d399;border:1px solid rgba(5,150,105,0.4);padding:2px 6px;border-radius:9999px;font-weight:700;flex-shrink:0">NODO</span>
                          )}
                        </button>
                      </div>
                    )
                  })}
                  {searching.value && (
                    <div style="padding:10px 12px;font-size:12px;color:#9ca3af;text-align:center">Buscando mas resultados...</div>
                  )}
                </div>
              )}

              {searchOpen.value && searchResults.value.length === 0 && searchQuery.value.length >= 2 && !searching.value && (
                <div style="position:absolute;top:100%;left:0;right:0;margin-top:6px;background:rgba(15,23,41,0.96);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;text-align:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
                  <span style="font-size:14px;color:#9ca3af">No se encontraron resultados</span>
                </div>
              )}
            </div>

            {/* Filter + refresh buttons */}
            <button
              style="width:44px;height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.92);border-radius:12px;border:1px solid rgba(255,255,255,0.08);color:white;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)"
              onClick={handleRefresh}
              aria-label="Actualizar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
            </button>
            <button
              style="width:44px;height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.92);border-radius:12px;border:1px solid rgba(255,255,255,0.08);color:white;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)"
              onClick={() => { showFilters.value = !showFilters.value }}
              aria-label="Filtros"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </button>
          </div>
        </div>

        {/* Help type filter chip */}
        {helpTypeFilter.value && (
          <div style="position:absolute;top:68px;left:12px;z-index:10000;background:rgba(15,23,41,0.92);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:6px 12px;display:flex;align-items:center;gap:8px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
            <span style="font-size:12px;color:white;font-weight:600">
              {TYPE_ICONS[helpTypeFilter.value] || '📋'} {LABEL_ES[helpTypeFilter.value] || helpTypeFilter.value}
            </span>
            <button style="color:#fca5a5;font-size:14px;background:none;border:none;cursor:pointer;margin-left:4px" onClick={clearFilter} aria-label="Quitar filtro">✕</button>
          </div>
        )}

        {/* Filter panel */}
        {showFilters.value && (
          <div style="position:absolute;top:68px;right:12px;z-index:10000;background:rgba(15,23,41,0.96);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px;max-height:60vh;overflow-y:auto;width:224px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
            {Object.entries(MAP_LABELS).map(([key, label]) => (
              <label key={key} style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.value.has(key)}
                  onChange={() => toggleLayer(key)}
                  style="border-radius:4px"
                />
                <span
                  style={`width:12px;height:12px;border-radius:50%;flex-shrink:0;background:${MAP_COLORS[key]}`}
                />
                <span style="font-size:14px;color:white">{label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Loading overlay */}
        {loading.value && (
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.5);z-index:9999">
            <Spinner size={40} />
          </div>
        )}

        {/* Bottom action bar - shows when external search pin is placed */}
        {searchPinPos.value && (
          <div style="position:absolute;bottom:0;left:0;right:0;z-index:10000;background:rgba(15,23,41,0.95);border-top:1px solid rgba(255,255,255,0.06);padding:12px 16px;padding-bottom:calc(12px + env(safe-area-inset-bottom, 0px));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
            <div style="text-align:center;margin-bottom:8px">
              <p style="font-size:14px;font-weight:700;color:white;margin:0 0 2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{searchPinTitle.value}</p>
              <p style="font-size:11px;color:#9ca3af;margin:0">Arrastra el pin para ajustar la ubicacion</p>
            </div>
            <div style="display:flex;gap:8px">
              <button
                type="button"
                onClick={clearSearch}
                style="flex-shrink:0;width:48px;height:48px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(30,41,59,0.8);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px"
                aria-label="Cancelar"
              >✕</button>
              <a
                href={`/necesito-ayuda?lat=${searchPinPos.value.lat}&lng=${searchPinPos.value.lng}`}
                style="flex:1;height:48px;border-radius:12px;background:#dc2626;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;cursor:pointer"
              >🆘 Crear solicitud aqui</a>
            </div>
          </div>
        )}
      </div>

      {/* Daños tab */}
      <div style={`position:absolute;top:48px;left:0;right:0;bottom:0;overflow:hidden;display:${activeTab.value === 'daños' ? 'flex' : 'none'};flex-direction:column`}>
        {/* StatusVzla Widget - fullscreen */}
        <div id="svzla-mapa" style="flex:1;display:flex;flex-direction:column;font-family:sans-serif;overflow:hidden;background:#f3f4f6">
          <div id="svzla-map" style="flex:1;background:#f3f4f6"></div>
          <div style="padding:8px 14px;background:#0D1117;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
            <span style="font-size:11px;color:#9BA5B0;">Datos: StatusVzla.com API</span>
            <a href="https://statusvzla.com/mapa-danos" target="_blank" rel="noopener noreferrer" style="font-size:10px;font-weight:800;color:#F5C518;text-decoration:none;">Powered by StatusVzla.com ↗</a>
          </div>
        </div>

        {/* Loading overlay */}
        {damageLoading.value && (
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.5);z-index:9999">
            <Spinner size={40} />
          </div>
        )}
      </div>
    </div>
  )
}
