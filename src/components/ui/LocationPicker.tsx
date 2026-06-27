import { useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { getCurrentPosition, type GeoPosition } from '../../lib/geolocation'
import { searchAll, type SearchResult } from '../../lib/location-search'
import { getConfig } from '../../lib/admin-config'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../lib/constants'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationPickerProps {
  onLocationChange: (location: { lat: number | null; lng: number | null; city: string; sector: string }) => void
  initialCity?: string
  initialLat?: number | null
  initialLng?: number | null
  compact?: boolean
}

const PIN_ICON = L.divIcon({
  className: '',
  html: '<div style="font-size:36px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));text-align:center;line-height:1">📍</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

const IN_APP_MSG = 'Este navegador puede limitar el acceso al GPS. Busca una direccion arriba o abre NODO en Safari o Chrome para usar tu ubicacion.'

export function LocationPicker({ onLocationChange, initialCity = '', initialLat = null, initialLng = null, compact = false }: LocationPickerProps) {
  const position = useSignal<GeoPosition | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  )
  const gpsLoading = useSignal(false)
  const gpsError = useSignal<string | null>(null)
  const city = useSignal(initialCity)
  const sector = useSignal('')
  const addressPreview = useSignal('')
  const showMap = useSignal(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const tempPos = useSignal<GeoPosition | null>(null)

  const searchQuery = useSignal('')
  const searchResults = useSignal<SearchResult[]>([])
  const searchOpen = useSignal(false)
  const searching = useSignal(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapInputRef = useRef<HTMLInputElement>(null)

  const notifyChange = (pos: GeoPosition | null, c: string, s: string) => {
    onLocationChange({ lat: pos?.lat ?? null, lng: pos?.lng ?? null, city: c, sector: s })
  }

  const openMap = () => {
    tempPos.value = position.value ? { ...position.value } : null
    showMap.value = true
  }

  const closeMap = () => {
    showMap.value = false
    searchQuery.value = ''
    searchResults.value = []
    searchOpen.value = false
    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
      markerRef.current = null
    }
  }

  const addOrMoveMarker = (map: L.Map, pos: GeoPosition) => {
    tempPos.value = pos
    if (markerRef.current) {
      markerRef.current.setLatLng([pos.lat, pos.lng])
    } else {
      markerRef.current = L.marker([pos.lat, pos.lng], { icon: PIN_ICON, draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const ll = markerRef.current!.getLatLng()
        tempPos.value = { lat: ll.lat, lng: ll.lng }
      })
    }
  }

  useEffect(() => {
    if (!showMap.value || !mapRef.current || mapInstance.current) return

    const center: [number, number] = tempPos.value
      ? [tempPos.value.lat, tempPos.value.lng]
      : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, tempPos.value ? 16 : DEFAULT_ZOOM)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    if (tempPos.value) {
      addOrMoveMarker(map, tempPos.value)
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      addOrMoveMarker(map, { lat: e.latlng.lat, lng: e.latlng.lng })
    })

    if (!tempPos.value) {
      getCurrentPosition(5000)
        .then((pos) => {
          map.setView([pos.lat, pos.lng], 16)
          addOrMoveMarker(map, pos)
        })
        .catch(() => {})
    }

    mapInstance.current = map
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
    }
  }, [showMap.value])

  // --- Search ---

  const handleMapSearch = (value: string) => {
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

  const selectSearchResult = (result: SearchResult) => {
    searchOpen.value = false
    searchQuery.value = result.title
    mapInputRef.current?.blur()
    const map = mapInstance.current
    if (!map) return
    addOrMoveMarker(map, { lat: result.lat, lng: result.lng })
    map.flyTo([result.lat, result.lng], 16, { duration: 1 })
  }

  const clearMapSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchOpen.value = false
  }

  // --- Confirm / GPS ---

  const confirmMapLocation = () => {
    if (tempPos.value) {
      position.value = { ...tempPos.value }
      notifyChange(tempPos.value, city.value, sector.value)
      reverseGeocode(tempPos.value.lat, tempPos.value.lng)
    }
    closeMap()
  }

  const handleGpsError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'inapp') {
      gpsError.value = IN_APP_MSG
    } else {
      gpsError.value = msg || 'No se pudo obtener la ubicacion'
    }
  }

  const useMyLocation = async () => {
    gpsLoading.value = true
    gpsError.value = null
    try {
      const pos = await getCurrentPosition()
      if (showMap.value && mapInstance.current) {
        addOrMoveMarker(mapInstance.current, pos)
        mapInstance.current.setView([pos.lat, pos.lng], 16)
      } else {
        position.value = pos
        notifyChange(pos, city.value, sector.value)
        reverseGeocode(pos.lat, pos.lng)
      }
    } catch (err) {
      handleGpsError(err)
    } finally {
      gpsLoading.value = false
    }
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`, {
        headers: { 'Accept-Language': 'es' },
      })
      if (!res.ok) return
      const data = await res.json()
      const addr = data.address || {}
      const parts: string[] = []
      if (addr.road) parts.push(addr.road)
      if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb)
      if (addr.city || addr.town || addr.village) {
        const detectedCity = addr.city || addr.town || addr.village
        parts.push(detectedCity)
        const configCities = getConfig().cities
        const match = configCities.find((c: string) => detectedCity.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(detectedCity.toLowerCase()))
        if (match && !city.value) {
          city.value = match
          notifyChange(position.value, city.value, sector.value)
        }
      }
      if (addr.state) parts.push(addr.state)
      addressPreview.value = parts.join(', ')
      if ((addr.neighbourhood || addr.suburb) && !sector.value) {
        sector.value = addr.neighbourhood || addr.suburb
        notifyChange(position.value, city.value, sector.value)
      }
    } catch {}
  }

  const updateCity = (e: Event) => {
    city.value = (e.target as HTMLSelectElement).value
    notifyChange(position.value, city.value, sector.value)
  }

  const updateSector = (e: Event) => {
    sector.value = (e.target as HTMLInputElement).value
    notifyChange(position.value, city.value, sector.value)
  }

  return (
    <div class="space-y-3">
      {/* Main button */}
      <button
        type="button"
        class={`w-full rounded-xl p-4 text-left font-semibold transition-colors border min-h-[56px] ${
          position.value
            ? 'bg-emerald-900/40 border-emerald-600/50 text-emerald-300'
            : 'bg-blue-900/40 border-blue-600/50 text-blue-300 hover:bg-blue-900/60'
        }`}
        onClick={openMap}
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">{position.value ? '✅' : '📍'}</span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold">
              {position.value ? 'Ubicacion seleccionada' : 'Seleccionar ubicacion en el mapa'}
            </div>
            {position.value && (
              <div class="text-xs opacity-80 mt-0.5 truncate">
                {addressPreview.value || `${position.value.lat.toFixed(5)}, ${position.value.lng.toFixed(5)}`}
              </div>
            )}
            {!position.value && (
              <div class="text-xs opacity-60 mt-0.5">Busca una direccion o toca el mapa</div>
            )}
          </div>
          <span class="text-lg opacity-60">{position.value ? '✏️' : '→'}</span>
        </div>
      </button>

      {/* GPS shortcut outside map */}
      {!position.value && (
        <button
          type="button"
          class="w-full rounded-lg p-3 text-sm font-medium border bg-nodo-card border-nodo-border text-nodo-muted hover:text-white transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          onClick={useMyLocation}
          disabled={gpsLoading.value}
        >
          {gpsLoading.value ? (
            <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>📍</span>
          )}
          Usar mi ubicacion actual (GPS)
        </button>
      )}

      {gpsError.value && !showMap.value && (
        <div class="bg-amber-900/30 border border-amber-700/40 rounded-lg p-3">
          <p class="text-amber-400 text-sm font-medium">{gpsError.value}</p>
        </div>
      )}

      {!compact && (
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-nodo-muted mb-1">Ciudad</label>
            <select class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white min-h-[44px]" value={city.value} onChange={updateCity}>
              <option value="">Seleccionar</option>
              {getConfig().cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label class="block text-sm text-nodo-muted mb-1">Sector / Zona</label>
            <input type="text" class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white min-h-[44px]" placeholder="Ej: Altamira" value={sector.value} onInput={updateSector} />
          </div>
        </div>
      )}

      {/* ===== Fullscreen map modal ===== */}
      {showMap.value && (
        <div style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:#0f1729">
          {/* Map fills entire screen */}
          <div ref={mapRef} style="position:absolute;top:0;left:0;right:0;bottom:0" />

          {/* Search bar floating on top of map */}
          <div style={`position:absolute;top:0;left:0;right:0;z-index:10000;padding-top:env(safe-area-inset-top, 0px)`}>
            <div style="padding:10px 12px 0 12px;display:flex;gap:8px;align-items:center">
              <button
                type="button"
                onClick={closeMap}
                aria-label="Cerrar"
                style="width:44px;height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.92);border-radius:12px;border:1px solid rgba(255,255,255,0.1);color:white;font-size:20px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)"
              >✕</button>

              <div style="flex:1;display:flex;align-items:center;background:rgba(15,23,41,0.92);border-radius:12px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
                <span style="padding-left:12px;font-size:16px;flex-shrink:0">🔍</span>
                <input
                  ref={mapInputRef}
                  type="search"
                  value={searchQuery.value}
                  onInput={(e) => handleMapSearch((e.target as HTMLInputElement).value)}
                  onFocus={() => { if (searchResults.value.length > 0) searchOpen.value = true }}
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder="Buscar direccion, refugio, hospital, sector..."
                  style="flex:1;background:transparent;color:white;font-size:14px;padding:12px 8px;outline:none;border:none;min-width:0"
                />
                {searchQuery.value && (
                  <button type="button" onClick={clearMapSearch} aria-label="Limpiar" style="padding:0 12px 0 4px;color:#9ca3af;font-size:16px;background:none;border:none;cursor:pointer">✕</button>
                )}
              </div>
            </div>

            {/* Search results dropdown */}
            {searchOpen.value && searchResults.value.length > 0 && (
              <div style="margin:6px 12px 0 12px;background:rgba(15,23,41,0.96);border:1px solid rgba(255,255,255,0.1);border-radius:12px;max-height:45vh;overflow-y:auto;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
                {searchResults.value.map((r, i) => {
                  const prevSource = i > 0 ? searchResults.value[i - 1].source : null
                  const showNodoHeader = i === 0 && r.source === 'nodo'
                  const showExtHeader = r.source === 'nominatim' && (i === 0 || prevSource === 'nodo')
                  return (
                    <div key={r.id}>
                      {showNodoHeader && (
                        <div style="padding:6px 12px;font-size:10px;color:#34d399;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">En NODO</div>
                      )}
                      {showExtHeader && (
                        <div style={`padding:6px 12px;font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em${prevSource === 'nodo' ? ';border-top:1px solid rgba(255,255,255,0.06)' : ''}`}>Otros lugares</div>
                      )}
                      <button
                        type="button"
                        onClick={() => selectSearchResult(r)}
                        style="width:100%;padding:10px 12px;display:flex;align-items:center;gap:10px;text-align:left;background:none;border:none;cursor:pointer;color:white"
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
                  <div style="padding:10px;font-size:12px;color:#9ca3af;text-align:center">Buscando...</div>
                )}
              </div>
            )}

            {searchOpen.value && searchResults.value.length === 0 && searchQuery.value.length >= 2 && !searching.value && (
              <div style="margin:6px 12px 0 12px;background:rgba(15,23,41,0.96);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;text-align:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">
                <span style="font-size:14px;color:#9ca3af">No se encontraron resultados</span>
              </div>
            )}
          </div>

          {/* Bottom bar floating on top of map */}
          <div style={`position:absolute;bottom:0;left:0;right:0;z-index:10000;background:rgba(15,23,41,0.95);border-top:1px solid rgba(255,255,255,0.06);padding:10px 16px;padding-bottom:calc(10px + env(safe-area-inset-bottom, 0px));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)`}>
            {tempPos.value && (
              <p style="font-size:11px;color:#9ca3af;text-align:center;margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                {tempPos.value.lat.toFixed(5)}, {tempPos.value.lng.toFixed(5)}
              </p>
            )}
            {!tempPos.value && (
              <p style="font-size:12px;color:#fbbf24;text-align:center;margin-bottom:8px">Busca una direccion, usa GPS o toca el mapa</p>
            )}

            {gpsError.value && showMap.value && (
              <div style="background:rgba(120,53,15,0.3);border:1px solid rgba(180,83,9,0.4);border-radius:10px;padding:10px;margin-bottom:8px">
                <p style="font-size:12px;color:#fbbf24;line-height:1.4">{gpsError.value}</p>
              </div>
            )}

            <div style="display:flex;gap:8px">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={gpsLoading.value}
                aria-label="Mi ubicacion"
                style="flex-shrink:0;width:48px;height:48px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(30,41,59,0.8);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer"
              >
                {gpsLoading.value ? (
                  <span style="display:inline-block;width:16px;height:16px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                )}
              </button>

              <button
                type="button"
                onClick={confirmMapLocation}
                disabled={!tempPos.value}
                style={`flex:1;height:48px;border-radius:12px;border:none;font-size:14px;font-weight:700;color:white;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:opacity 0.2s;${
                  tempPos.value
                    ? 'background:#2563eb'
                    : 'background:#4b5563;opacity:0.5;cursor:not-allowed'
                }`}
              >
                📍 Confirmar ubicacion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
