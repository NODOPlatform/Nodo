import { signal } from '@preact/signals'

export interface SeismicEvent {
  id: string
  magnitude: number
  place: string
  time: number
  url: string
  lat: number
  lng: number
  depth: number
  felt: number | null
  tsunami: number
}

export const seismicEvents = signal<SeismicEvent[]>([])
export const seismicLoading = signal(false)
export const seismicError = signal<string | null>(null)
export const seismicLastChecked = signal<number>(0)

const VE_BOUNDS = { minLat: 0.5, maxLat: 16, minLng: -74, maxLng: -59 }
const RADIUS_KM = 800
const VE_CENTER = { lat: 8.0, lng: -66.0 }

function isNearVenezuela(lat: number, lng: number): boolean {
  return lat >= VE_BOUNDS.minLat && lat <= VE_BOUNDS.maxLat &&
    lng >= VE_BOUNDS.minLng && lng <= VE_BOUNDS.maxLng
}

export async function loadSeismicData() {
  if (seismicLoading.value) return
  seismicLoading.value = true
  seismicError.value = null

  try {
    const now = Date.now()
    const start = new Date(now - 7 * 24 * 3600000).toISOString().split('.')[0]
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&latitude=${VE_CENTER.lat}&longitude=${VE_CENTER.lng}&maxradiuskm=${RADIUS_KM}&minmagnitude=2.5&orderby=time&limit=20`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`USGS ${res.status}`)
    const data = await res.json()

    const events: SeismicEvent[] = (data.features || [])
      .filter((f: Record<string, unknown>) => {
        const coords = (f.geometry as Record<string, unknown>)?.coordinates as number[]
        return coords && isNearVenezuela(coords[1], coords[0])
      })
      .map((f: Record<string, unknown>) => {
        const p = f.properties as Record<string, unknown>
        const coords = (f.geometry as Record<string, unknown>)?.coordinates as number[]
        return {
          id: f.id as string,
          magnitude: p.mag as number,
          place: p.place as string,
          time: p.time as number,
          url: p.url as string,
          lat: coords[1],
          lng: coords[0],
          depth: coords[2],
          felt: (p.felt as number | null) ?? null,
          tsunami: (p.tsunami as number) || 0,
        }
      })

    seismicEvents.value = events
    seismicLastChecked.value = now
  } catch (e) {
    seismicError.value = e instanceof Error ? e.message : 'Error cargando datos sismicos'
    console.error('[Seismic]', e)
  } finally {
    seismicLoading.value = false
  }
}

export function getSeismicSummary(): string {
  const events = seismicEvents.value
  if (events.length === 0) return 'No hay alertas sismicas recientes.'

  const recent = events[0]
  const ago = timeAgoShort(recent.time)
  const mag = recent.magnitude.toFixed(1)
  return `Sismo M${mag} registrado ${ago}. ${recent.place || ''}`
}

function timeAgoShort(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 60000)
  if (diff < 1) return 'justo ahora'
  if (diff < 60) return `hace ${diff} min`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}
