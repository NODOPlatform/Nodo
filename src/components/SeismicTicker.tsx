import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { seismicEvents, seismicLoading, loadSeismicData } from '../store/seismic'

function timeAgoShort(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 60000)
  if (diff < 1) return 'justo ahora'
  if (diff < 60) return `hace ${diff} min`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

function magColor(m: number): string {
  if (m >= 6) return '#dc2626'
  if (m >= 5) return '#f97316'
  if (m >= 4) return '#eab308'
  return '#22c55e'
}

export function SeismicTicker() {
  const expanded = useSignal(false)

  useEffect(() => {
    loadSeismicData()
    const interval = setInterval(loadSeismicData, 5 * 60000)
    return () => clearInterval(interval)
  }, [])

  const events = seismicEvents.value
  const loading = seismicLoading.value

  if (loading && events.length === 0) return null

  const hasEvents = events.length > 0
  const recent = events[0]

  return (
    <div class="mx-4 mb-3">
      <button
        onClick={() => { expanded.value = !expanded.value }}
        class="w-full rounded-xl border transition-all duration-200 overflow-hidden"
        style={{
          background: hasEvents ? 'rgba(234, 179, 8, 0.08)' : 'rgba(34, 197, 94, 0.06)',
          borderColor: hasEvents ? 'rgba(234, 179, 8, 0.25)' : 'rgba(34, 197, 94, 0.2)',
        }}
      >
        <div class="flex items-center gap-2 px-3 py-2">
          <span class="text-base flex-shrink-0">{hasEvents ? '🌎' : '✅'}</span>
          <div class="flex-1 min-w-0 overflow-hidden">
            {hasEvents ? (
              <div class="whitespace-nowrap animate-ticker">
                <span class="text-xs font-medium">
                  Sismo M{recent.magnitude.toFixed(1)} registrado {timeAgoShort(recent.time)}.{' '}
                  📍 {recent.place || 'Ubicacion desconocida'}.
                  {events.length > 1 && ` +${events.length - 1} eventos recientes.`}
                </span>
              </div>
            ) : (
              <span class="text-xs text-nodo-muted">No hay alertas sismicas recientes.</span>
            )}
          </div>
          {hasEvents && (
            <svg class={`w-3.5 h-3.5 text-nodo-muted flex-shrink-0 transition-transform duration-200 ${expanded.value ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          )}
        </div>
      </button>

      {expanded.value && hasEvents && (
        <div class="mt-1.5 bg-nodo-card border border-nodo-border rounded-xl overflow-hidden divide-y divide-nodo-border animate-fade-in">
          {events.slice(0, 8).map(ev => (
            <a
              key={ev.id}
              href={ev.url}
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
            >
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                style={{ background: magColor(ev.magnitude) }}
              >
                {ev.magnitude.toFixed(1)}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium truncate">{ev.place || 'Sismo detectado'}</p>
                <p class="text-[10px] text-nodo-muted">
                  {timeAgoShort(ev.time)} · Prof. {ev.depth.toFixed(0)} km
                  {ev.felt ? ` · Sentido por ${ev.felt} personas` : ''}
                </p>
              </div>
              <svg class="w-3.5 h-3.5 text-nodo-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </a>
          ))}
          <div class="px-3 py-2 text-center">
            <span class="text-[10px] text-nodo-muted">Datos: USGS Earthquake Hazards Program</span>
          </div>
        </div>
      )}
    </div>
  )
}
