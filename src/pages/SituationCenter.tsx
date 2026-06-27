import { useSignal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { Spinner } from '../components/ui/Spinner'
import { initConnectors } from '../lib/connect/connectors'
import { buildSituationData } from '../lib/connect/situation-center'
import type { SituationData } from '../lib/connect/situation-center'

const STATUS_ICONS: Record<string, string> = {
  operational: '🟢', degraded: '🟡', down: '🔴',
}
const STATUS_LABELS: Record<string, string> = {
  operational: 'Operativo', degraded: 'Degradado', down: 'Fuera de linea',
}
const ENTITY_ICONS: Record<string, string> = {
  person: '👤', hospital: '🏥', shelter: '🏠', resource: '📦', pet: '🐾',
}
const PERSON_STATUS_COLORS: Record<string, string> = {
  missing: '#ef4444', found: '#22c55e', safe: '#10b981',
  hospitalized: '#3b82f6', reunited: '#ec4899', deceased: '#6b7280',
}
const PET_STATUS_COLORS: Record<string, string> = {
  missing: '#ef4444', found: '#22c55e', shelter: '#8b5cf6', reunited: '#ec4899',
}

export function SituationCenter() {
  const { route } = useLocation()
  const data = useSignal<SituationData | null>(null)

  if (!data.value) {
    initConnectors()
    data.value = buildSituationData()
  }

  const d = data.value
  if (!d) return <div class="p-4 pb-20 max-w-lg mx-auto"><Spinner size={24} /></div>

  const { network, counts, recentUpdates, coverage } = d

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div class="flex items-center gap-3 mb-4">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 class="text-lg font-bold flex items-center gap-2">
            <span>🌐</span> Centro Nacional de Situacion
          </h2>
          <p class="text-[10px] text-nodo-muted font-semibold uppercase tracking-wider">Red NODO · Estado general</p>
        </div>
      </div>

      {/* Network status */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">🌐</span>
          <h3 class="text-sm font-bold text-white">Estado de la Red</h3>
          <span class="text-[10px]">{STATUS_ICONS[network.healthStatus]}</span>
          <span class="text-[10px] text-nodo-muted">{STATUS_LABELS[network.healthStatus]}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <StatBox label="Nodos conectados" value={network.totalConnectors} />
          <StatBox label="Nodos activos" value={network.activeConnectors} />
          <StatBox label="Respuesta promedio" value={network.avgResponseMs > 0 ? `${network.avgResponseMs}ms` : '—'} />
          <StatBox label="Ultima actividad" value={network.lastActivity ? timeSince(network.lastActivity) : 'Sin actividad'} />
        </div>
      </div>

      {/* Persons */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">👤</span>
          <h3 class="text-sm font-bold text-white">Personas</h3>
          <span class="text-[10px] font-semibold bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">{counts.persons.total}</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <CountChip label="Desaparecidas" count={counts.persons.missing} color={PERSON_STATUS_COLORS.missing} />
          <CountChip label="Encontradas" count={counts.persons.found} color={PERSON_STATUS_COLORS.found} />
          <CountChip label="A salvo" count={counts.persons.safe} color={PERSON_STATUS_COLORS.safe} />
          <CountChip label="Hospitalizadas" count={counts.persons.hospitalized} color={PERSON_STATUS_COLORS.hospitalized} />
          <CountChip label="Reunidas" count={counts.persons.reunited} color={PERSON_STATUS_COLORS.reunited} />
          {counts.persons.deceased > 0 && (
            <CountChip label="Fallecidas" count={counts.persons.deceased} color={PERSON_STATUS_COLORS.deceased} />
          )}
        </div>
      </div>

      {/* Health */}
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-base">🏥</span>
            <h3 class="text-[12px] font-bold text-white">Salud</h3>
          </div>
          <div class="text-2xl font-bold text-white mb-0.5">{counts.hospitals.total}</div>
          <p class="text-[10px] text-nodo-muted">Hospitales registrados</p>
        </div>

        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-base">🏠</span>
            <h3 class="text-[12px] font-bold text-white">Refugios</h3>
          </div>
          <div class="text-2xl font-bold text-white mb-0.5">{counts.shelters.total}</div>
          <p class="text-[10px] text-nodo-muted">Refugios activos</p>
        </div>
      </div>

      {/* Resources */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">📦</span>
          <h3 class="text-sm font-bold text-white">Recursos</h3>
          <span class="text-[10px] font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">{counts.resources.total}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <CountChip label="Centros de acopio" count={counts.resources.acopio} color="#eab308" />
          <CountChip label="Campanas" count={counts.resources.campaigns} color="#f97316" />
        </div>
      </div>

      {/* Pets */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">🐾</span>
          <h3 class="text-sm font-bold text-white">Mascotas</h3>
          <span class="text-[10px] font-semibold bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">{counts.pets.total}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <CountChip label="Perdidas" count={counts.pets.missing} color={PET_STATUS_COLORS.missing} />
          <CountChip label="Encontradas" count={counts.pets.found} color={PET_STATUS_COLORS.found} />
          <CountChip label="En refugio" count={counts.pets.shelter} color={PET_STATUS_COLORS.shelter} />
          <CountChip label="Reunidas" count={counts.pets.reunited} color={PET_STATUS_COLORS.reunited} />
        </div>
      </div>

      {/* Recent activity */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">🕐</span>
          <h3 class="text-sm font-bold text-white">Actividad reciente</h3>
        </div>
        <div class="space-y-2">
          {recentUpdates.map((u, i) => (
            <div key={i} class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
              <span class="text-[11px]">{ENTITY_ICONS[u.entityType] || '📋'}</span>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] text-white truncate">{u.name}</p>
                <p class="text-[9px] text-nodo-muted">{u.source}</p>
              </div>
              <div class="flex flex-col items-end flex-shrink-0">
                <span class="text-[9px] font-semibold" style={{ color: PERSON_STATUS_COLORS[u.status] || '#94a3b8' }}>
                  {u.status}
                </span>
                <span class="text-[8px] text-nodo-muted">{u.staleness}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">📊</span>
          <h3 class="text-sm font-bold text-white">Cobertura de la Red</h3>
        </div>
        <div class="space-y-2">
          {coverage.map(c => (
            <div key={c.providerId} class="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.02]">
              <div class="min-w-0">
                <p class="text-[11px] text-white font-semibold truncate">{c.providerName}</p>
                <div class="flex gap-1 mt-0.5">
                  {c.entityTypes.map(t => (
                    <span key={t} class="text-[8px]">{ENTITY_ICONS[t] || '📋'}</span>
                  ))}
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <div class="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min((c.recordCount / Math.max(...coverage.map(x => x.recordCount))) * 100, 100)}%` }}
                  />
                </div>
                <span class="text-[11px] font-bold text-white w-6 text-right">{c.recordCount}</span>
              </div>
            </div>
          ))}
        </div>
        <div class="mt-3 pt-2 border-t border-white/[0.06]">
          <p class="text-[10px] text-nodo-muted">
            Total: <strong class="text-white">{coverage.reduce((s, c) => s + c.recordCount, 0)}</strong> registros en <strong class="text-white">{coverage.length}</strong> plataformas
          </p>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div class="bg-white/[0.03] rounded-lg p-2">
      <div class="text-[15px] font-bold text-white">{value}</div>
      <div class="text-[9px] text-nodo-muted leading-tight">{label}</div>
    </div>
  )
}

function CountChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div class="bg-white/[0.03] rounded-lg p-2 text-center">
      <div class="text-[15px] font-bold" style={{ color }}>{count}</div>
      <div class="text-[9px] text-nodo-muted leading-tight">{label}</div>
    </div>
  )
}

function timeSince(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}
