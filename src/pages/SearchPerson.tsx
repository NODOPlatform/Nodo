import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { Button } from '../components/ui/Button'
import { PersonStatusBadge } from '../components/ui/StatusBadge'
import { Spinner } from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/photo'
import { classifyContent, ocrImage } from '../lib/universal-classifier'
import type { OcrProgressCallback, ClassificationResult } from '../lib/universal-classifier'
import { getGroupedProviders, getStatusInfo, buildSearchUrl } from '../lib/red-nodo'
import type { SearchProvider } from '../lib/red-nodo'
import { findMatches, buildMatchQuery, getMatchLevel, MATCH_LEVEL_CONFIG } from '../lib/person-matching'
import type { MatchCandidate } from '../lib/person-matching'
import { buildTimeline, EVENT_TYPE_CONFIG, VERIFICATION_LABELS } from '../lib/person-timeline'
import type { TimelineEvent } from '../lib/person-timeline'
import { buildProfile } from '../lib/person-profile'
import type { UnifiedProfile } from '../lib/person-profile'
import type { Person, PersonStatusHistory } from '../types'
import { initConnectors } from '../lib/connect/connectors'
import { adaptiveSearch, getRegisteredConnectors, getConnectorMetrics } from '../lib/connect/connector-manager'
import { deduplicateResults } from '../lib/connect/connector-normalizer'
import type { FederatedResult, ConnectorResponse } from '../lib/connect/connector-types'
import { buildEvidenceFromFederated, buildEntityEvidence, EVIDENCE_CONFIG } from '../lib/connect/evidence-engine'
import type { EvidenceReport } from '../lib/connect/evidence-engine'
import { buildHumanitarianIndex } from '../lib/connect/humanitarian-index'
import type { HumanitarianSummary } from '../lib/connect/humanitarian-index'
import { buildContext } from '../lib/connect/humanitarian-context'
import type { HumanitarianContext as HCtxType } from '../lib/connect/humanitarian-context'
import { HumanitarianContext as HumanitarianContextPanel } from '../components/HumanitarianContext'
import { buildBrief } from '../lib/connect/humanitarian-brief'
import type { HumanitarianBrief as BriefType } from '../lib/connect/humanitarian-brief'
import { HumanitarianBrief as HumanitarianBriefPanel } from '../components/HumanitarianBrief'

// --- Badge config ---
const BADGE_CONFIG: Record<string, { emoji: string; label: string; bg: string; text: string }> = {
  verified: { emoji: '✓', label: 'Verificada por NODO', bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  recommended: { emoji: '⭐', label: 'Recomendada', bg: 'rgba(234,179,8,0.12)', text: '#eab308' },
  collaborator: { emoji: '🤝', label: 'Colaboradora', bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
}

// --- Provider card ---
function ProviderCard({ provider, query }: { provider: SearchProvider; query: string }) {
  const st = getStatusInfo(provider)
  const bdg = BADGE_CONFIG[provider.badge] || BADGE_CONFIG.collaborator
  const href = query ? buildSearchUrl(provider, query) : provider.url
  const disabled = provider.status === 'offline'

  return (
    <div
      class="rounded-2xl overflow-hidden"
      style={{
        background: `${provider.color}0A`,
        border: `1px solid ${provider.color}25`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div class="p-4">
        <div class="flex items-start gap-3">
          <span
            class="flex-shrink-0 flex items-center justify-center text-xl rounded-xl"
            style={{ width: 44, height: 44, background: `${provider.color}18`, border: `1px solid ${provider.color}30` }}
          >
            {provider.icon}
          </span>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-[15px] text-white leading-tight">{provider.name}</h4>
            <p class="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {provider.description}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-3 flex-wrap">
          {provider.verified && (
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              Verificada
            </span>
          )}
          <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: bdg.bg, color: bdg.text }}>
            {bdg.emoji} {bdg.label}
          </span>
          <span class="inline-flex items-center gap-1.5 text-[10px] text-nodo-muted">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block', boxShadow: `0 0 4px ${st.dot}` }} />
            {st.label}
          </span>
          {provider.coverage && (
            <span class="text-[10px] text-nodo-muted">· {provider.coverage}</span>
          )}
        </div>

        {!disabled && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.97]"
            style={{ background: `${provider.color}20`, color: provider.color, border: `1px solid ${provider.color}30` }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Buscar{query ? ` "${query}"` : ''}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        )}
      </div>
    </div>
  )
}

// --- Federated Nodes panel ---
function FederatedNodesPanel() {
  const connectors = getRegisteredConnectors()
  const allMetrics = getConnectorMetrics()
  const upcoming = ['sismo-venezuela', 'apoyo-vzla', 'red-solidaria-venezuela']
  const UPCOMING_LABELS: Record<string, string> = {
    'sismo-venezuela': 'Sismo Venezuela',
    'apoyo-vzla': 'ApoyoVzla',
    'red-solidaria-venezuela': 'Red Solidaria Venezuela',
  }

  return (
    <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-base">🌐</span>
        <h4 class="text-sm font-bold text-white">Red NODO</h4>
        <span class="text-[10px] text-nodo-muted">Nodos federados</span>
      </div>

      <div class="space-y-1.5 mb-3">
        {connectors.filter(c => c.enabled).map(c => {
          const m = allMetrics.find(x => x.providerId === c.providerId)
          const isDown = m?.isTemporarilyDown
          const hasErrors = m && m.totalErrors > 0
          return (
            <div key={c.providerId} class="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.02]">
              <span class="text-[11px] text-white/80 truncate">{c.providerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                {m && m.avgResponseMs > 0 && (
                  <span class="text-[8px] text-nodo-muted">{m.avgResponseMs}ms</span>
                )}
                <span class="text-[10px]">{isDown ? '❌' : hasErrors ? '⚠️' : '✅'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {upcoming.length > 0 && (
        <div>
          <p class="text-[9px] text-nodo-muted uppercase tracking-wider mb-1.5">Proximamente</p>
          <div class="space-y-1">
            {upcoming.map(id => (
              <div key={id} class="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.01]">
                <span class="text-[11px] text-white/40">{UPCOMING_LABELS[id] || id}</span>
                <span class="text-[10px]">🔄</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Federation section ---
function FederationSection({ query }: { query: string }) {
  const groups = getGroupedProviders()
  if (groups.length === 0) return null

  return (
    <div class="mt-8">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-base">🌐</span>
        <h3 class="font-bold text-base text-white">Red NODO</h3>
      </div>
      <p class="text-nodo-muted text-[12px] mb-5 leading-relaxed">
        {groups.reduce((n, g) => n + g.providers.length, 0)} plataformas conectadas en {groups.length} categorias.
      </p>

      {groups.map((group) => (
        <div key={group.category} class="mb-5">
          <h4 class="text-[12px] font-bold text-nodo-muted uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span class="text-sm">{group.icon}</span> {group.label}
          </h4>
          <div class="space-y-2.5">
            {group.providers.map((p) => (
              <ProviderCard key={p.id} provider={p} query={query} />
            ))}
          </div>
        </div>
      ))}

      <div class="mt-4 bg-nodo-card border border-nodo-border rounded-2xl p-5 text-center">
        <h4 class="font-semibold text-sm text-white mb-1.5">Conoces otra plataforma que pueda ayudar?</h4>
        <p class="text-[11px] text-nodo-muted leading-relaxed mb-3">
          NODO crece gracias a la colaboracion. Sugiere una organizacion o plataforma confiable para integrarla.
        </p>
        <a
          href="mailto:nahuntrader33@gmail.com?subject=Sugerencia%20de%20plataforma%20para%20NODO&body=Nombre%20de%20la%20plataforma%3A%0AEnlace%3A%0ADescripcion%20breve%3A"
          class="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-nodo-border rounded-xl px-5 py-2.5 text-sm font-semibold text-nodo-muted transition-colors active:scale-[0.97]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Sugerir plataforma
        </a>
      </div>

      <p class="text-[10px] text-nodo-muted text-center mt-4 leading-relaxed px-2">
        NODO no reemplaza estas plataformas. Las conecta para ofrecer un unico punto de acceso a recursos verificados durante la emergencia.
      </p>
    </div>
  )
}

// --- Share panel ---
function SharePanel({ name, description, photoUrl }: { name: string; description?: string; photoUrl?: string }) {
  const shared = useSignal(false)
  const text = `🚨 Se busca: ${name}\n${description ? `${description}\n` : ''}\nAyuda a difundir este caso.\nhttps://nodoayuda.com/buscar-persona`

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Se busca: ${name}`, text, url: 'https://nodoayuda.com/buscar-persona' }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text)
        shared.value = true
        setTimeout(() => { shared.value = false }, 3000)
      } catch {}
    }
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent('https://nodoayuda.com/buscar-persona')}&text=${encodeURIComponent(text)}`

  return (
    <div class="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30 rounded-2xl p-5 mt-4">
      {photoUrl && (
        <div class="flex justify-center mb-3">
          <img src={photoUrl} class="w-20 h-20 rounded-xl object-cover border-2 border-blue-500/30" alt={name} />
        </div>
      )}
      <p class="text-center text-sm font-bold text-white mb-1">Compartir este caso</p>
      <p class="text-center text-[11px] text-blue-200/60 mb-4">Cada persona que comparte multiplica las posibilidades de encontrar a alguien.</p>

      <button
        onClick={handleShare}
        class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] mb-3"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        {shared.value ? 'Enlace copiado!' : 'Compartir este caso'}
      </button>

      <div class="grid grid-cols-2 gap-2">
        <a href={waUrl} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 bg-green-700/30 hover:bg-green-700/50 border border-green-600/30 text-green-400 font-semibold rounded-xl py-2.5 text-xs transition-all active:scale-[0.97]">
          <span>📱</span> WhatsApp
        </a>
        <a href={tgUrl} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 bg-sky-700/30 hover:bg-sky-700/50 border border-sky-600/30 text-sky-400 font-semibold rounded-xl py-2.5 text-xs transition-all active:scale-[0.97]">
          <span>✈️</span> Telegram
        </a>
      </div>
    </div>
  )
}

// --- Match score badge ---
function MatchBadge({ score }: { score: number }) {
  const level = getMatchLevel(score)
  const cfg = MATCH_LEVEL_CONFIG[level]
  return (
    <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      {score}% {cfg.label}
    </span>
  )
}

// --- Unified profile card ---
function ProfileCard({ profile, onViewTimeline }: { profile: UnifiedProfile; onViewTimeline: () => void }) {
  return (
    <div class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden mb-3">
      {profile.photoUrl && (
        <img src={profile.photoUrl} class="w-full h-40 object-cover" alt={`${profile.firstName} ${profile.lastName}`} />
      )}
      <div class="p-4">
        <div class="flex items-start justify-between mb-2">
          <div>
            <h3 class="text-lg font-bold text-white">{profile.firstName} {profile.lastName}</h3>
            {profile.age && <p class="text-sm text-nodo-muted">~{profile.age} anos</p>}
            {profile.lastLocation && <p class="text-sm text-nodo-muted">{profile.lastLocation}</p>}
          </div>
          <PersonStatusBadge status={profile.currentStatus as Person['current_status']} />
        </div>

        <div class="flex flex-wrap gap-2 mt-3 mb-3">
          <span class="text-[10px] font-semibold bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
            {profile.sources.length} {profile.sources.length === 1 ? 'fuente' : 'fuentes'}
          </span>
          {profile.matchCount > 0 && (
            <span class="text-[10px] font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">
              {profile.matchCount} {profile.matchCount === 1 ? 'coincidencia' : 'coincidencias'}
            </span>
          )}
          <MatchBadge score={profile.confidence} />
        </div>

        {/* Sources */}
        <div class="space-y-1 mb-3">
          {profile.sources.map((src) => (
            <div key={src.recordId} class="flex items-center gap-2 text-[11px] text-nodo-muted">
              <span>{src.platformIcon}</span>
              <span class="font-medium">{src.platform}</span>
              <span>·</span>
              <PersonStatusBadge status={src.status as Person['current_status']} />
            </div>
          ))}
        </div>

        <button
          onClick={onViewTimeline}
          class="w-full flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-nodo-border rounded-xl py-2 text-xs font-semibold text-nodo-muted transition-colors active:scale-[0.97]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Ver linea temporal
        </button>
      </div>
    </div>
  )
}

// --- Timeline view ---
function TimelineView({ events, onClose }: { events: TimelineEvent[]; onClose: () => void }) {
  const formatDate = (d: string) => new Date(d).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden mb-4">
      <div class="flex items-center justify-between px-4 py-3 border-b border-nodo-border">
        <h4 class="text-sm font-bold text-white flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Linea temporal
        </h4>
        <button onClick={onClose} class="text-nodo-muted hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="p-4">
        {events.length === 0 && (
          <p class="text-nodo-muted text-sm text-center py-4">No hay eventos registrados.</p>
        )}
        <div class="relative">
          {events.length > 1 && (
            <div class="absolute left-[15px] top-4 bottom-4 w-px bg-nodo-border" />
          )}
          <div class="space-y-4">
            {events.map((ev) => {
              const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.status_update
              const vl = VERIFICATION_LABELS[ev.source.verificationLevel] || VERIFICATION_LABELS.unverified
              return (
                <div key={ev.id} class="flex gap-3 relative">
                  <div
                    class="w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm flex-shrink-0 z-10"
                    style={{ background: `${cfg.color}20`, border: `2px solid ${cfg.color}` }}
                  >
                    {cfg.icon}
                  </div>
                  <div class="flex-1 min-w-0 pb-1">
                    <p class="text-sm font-semibold text-white">{ev.title}</p>
                    {ev.description && <p class="text-xs text-nodo-muted mt-0.5">{ev.description}</p>}
                    {ev.location && <p class="text-[11px] text-nodo-muted mt-0.5">📍 {ev.location}</p>}
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="text-[10px] text-nodo-muted">{formatDate(ev.date)}</span>
                      <span class="text-[10px] text-nodo-muted">·</span>
                      <span class="text-[10px]" style={{ color: vl.color }}>
                        {ev.source.platformIcon} {ev.source.platform} · {vl.label}
                      </span>
                      {ev.source.organization && (
                        <span class="text-[10px] text-nodo-muted">· {ev.source.organization}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Verification alert for possible duplicates ---
function VerificationAlert({ matches, onView, onDismiss }: { matches: MatchCandidate[]; onView: (id: string) => void; onDismiss: () => void }) {
  if (matches.length === 0) return null
  return (
    <div class="bg-amber-900/25 border border-amber-700/40 rounded-2xl p-4 mb-4">
      <div class="flex items-start gap-3 mb-3">
        <span class="text-xl">⚠️</span>
        <div>
          <p class="text-sm font-bold text-amber-300">Posible caso existente</p>
          <p class="text-[11px] text-amber-200/60">Se encontraron {matches.length} {matches.length === 1 ? 'registro similar' : 'registros similares'} en NODO.</p>
        </div>
      </div>
      <div class="space-y-2">
        {matches.slice(0, 3).map((m) => (
          <button
            key={m.person.id}
            onClick={() => onView(m.person.id)}
            class="w-full flex items-center justify-between bg-nodo-dark/60 border border-nodo-border rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] active:scale-[0.98]"
          >
            <div class="flex-1 min-w-0">
              <span class="text-sm font-semibold text-white">{m.person.first_name} {m.person.last_name}</span>
              {m.person.city && <span class="text-[11px] text-nodo-muted ml-2">{m.person.city}</span>}
            </div>
            <MatchBadge score={m.score} />
          </button>
        ))}
      </div>
      <div class="flex gap-2 mt-3">
        <button
          onClick={onDismiss}
          class="flex-1 text-[11px] font-semibold text-nodo-muted bg-white/[0.06] hover:bg-white/[0.10] border border-nodo-border rounded-xl py-2 transition-colors"
        >
          Crear nuevo caso igualmente
        </button>
      </div>
    </div>
  )
}

// --- AI extraction result fields ---
interface ExtractedPerson {
  firstName: string
  lastName: string
  age: string
  sex: string
  phone: string
  whatsapp: string
  hospital: string
  city: string
  lastLocation: string
  description: string
  date: string
  organization: string
  source: string
  photoUrl: string
}

function emptyExtracted(): ExtractedPerson {
  return { firstName: '', lastName: '', age: '', sex: '', phone: '', whatsapp: '', hospital: '', city: '', lastLocation: '', description: '', date: '', organization: '', source: '', photoUrl: '' }
}

function populateFromClassification(result: ClassificationResult): ExtractedPerson {
  const f = result.fields
  const personName = (f.personName?.value as string) || ''
  const parts = personName.split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    age: f.age?.value != null ? String(f.age.value) : '',
    sex: '',
    phone: (f.phone?.value as string) || '',
    whatsapp: (f.whatsapp?.value as string) || '',
    hospital: '',
    city: '',
    lastLocation: ((f.locations?.value as string[]) || [])[0] || '',
    description: result.description || '',
    date: (f.startDate?.value as string) || '',
    organization: (f.organization?.value as string) || '',
    source: '',
    photoUrl: '',
  }
}

// --- AI Photo extraction panel ---
function AiExtractPanel({ onSearch }: { onSearch: (firstName: string, lastName: string, extracted: ExtractedPerson) => void }) {
  const mode = useSignal<'idle' | 'processing' | 'review'>('idle')
  const ocrProgress = useSignal(0)
  const ocrStatus = useSignal('')
  const extracted = useSignal<ExtractedPerson>(emptyExtracted())
  const previewUrl = useSignal<string | null>(null)

  const handleFile = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    mode.value = 'processing'
    ocrProgress.value = 0
    ocrStatus.value = 'Cargando imagen...'

    try {
      const compressed = await compressImage(file, 1200, 0.8)
      const reader = new FileReader()
      reader.onload = () => { previewUrl.value = reader.result as string }
      reader.readAsDataURL(compressed)

      const progressCb: OcrProgressCallback = (p, s) => { ocrProgress.value = p; ocrStatus.value = s }
      const text = await ocrImage(file, progressCb)

      if (!text || text.length < 5) {
        ocrStatus.value = 'No se detecto texto en la imagen.'
        mode.value = 'idle'
        return
      }

      ocrStatus.value = 'Analizando contenido...'
      const result = classifyContent(text)
      extracted.value = { ...populateFromClassification(result), photoUrl: previewUrl.value || '' }
      mode.value = 'review'
    } catch {
      ocrStatus.value = 'Error al procesar la imagen.'
      mode.value = 'idle'
    }
  }

  const handleSearchFromExtracted = () => {
    const ex = extracted.value
    onSearch(ex.firstName.trim(), ex.lastName.trim(), ex)
    mode.value = 'idle'
    extracted.value = emptyExtracted()
    previewUrl.value = null
  }

  const handleCancel = () => {
    mode.value = 'idle'
    extracted.value = emptyExtracted()
    previewUrl.value = null
  }

  const updateField = (key: keyof ExtractedPerson, val: string) => {
    extracted.value = { ...extracted.value, [key]: val }
  }

  if (mode.value === 'processing') {
    return (
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-5 mb-4">
        <div class="flex items-center gap-3 mb-3">
          <Spinner size={20} />
          <span class="text-sm font-semibold text-white">{ocrStatus.value}</span>
        </div>
        <div class="w-full bg-nodo-dark rounded-full h-2 overflow-hidden">
          <div class="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${ocrProgress.value}%` }} />
        </div>
      </div>
    )
  }

  if (mode.value === 'review') {
    const ex = extracted.value
    const FIELDS: { key: keyof ExtractedPerson; label: string; placeholder: string }[] = [
      { key: 'firstName', label: 'Nombre', placeholder: 'Nombre' },
      { key: 'lastName', label: 'Apellido', placeholder: 'Apellido' },
      { key: 'age', label: 'Edad', placeholder: 'Ej: 35' },
      { key: 'sex', label: 'Sexo', placeholder: 'M / F' },
      { key: 'phone', label: 'Telefono', placeholder: '+58...' },
      { key: 'whatsapp', label: 'WhatsApp', placeholder: '+58...' },
      { key: 'hospital', label: 'Hospital', placeholder: 'Nombre del hospital' },
      { key: 'city', label: 'Ciudad', placeholder: 'Ciudad' },
      { key: 'lastLocation', label: 'Ultima ubicacion', placeholder: 'Direccion o referencia' },
      { key: 'date', label: 'Fecha', placeholder: 'YYYY-MM-DD' },
      { key: 'organization', label: 'Organizacion', placeholder: 'ONG, institución...' },
      { key: 'source', label: 'Fuente', placeholder: 'Donde se obtuvo la info' },
    ]

    return (
      <div class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden mb-4">
        <div class="bg-amber-900/30 border-b border-amber-700/30 px-4 py-2.5">
          <p class="text-[12px] text-amber-300 font-semibold">La IA extrajo los datos. Revisa y corrige antes de buscar.</p>
        </div>

        <div class="p-4">
          {previewUrl.value && (
            <div class="flex justify-center mb-4">
              <img src={previewUrl.value} class="max-h-40 rounded-xl border border-nodo-border object-contain" alt="Imagen cargada" />
            </div>
          )}

          <div class="grid grid-cols-2 gap-2 mb-3">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} class={key === 'lastLocation' || key === 'description' ? 'col-span-2' : ''}>
                <label class="text-[10px] text-nodo-muted font-semibold uppercase tracking-wider block mb-0.5">{label}</label>
                <input
                  type="text"
                  class="w-full bg-nodo-dark border border-nodo-border rounded-lg px-3 py-2 text-sm text-white"
                  placeholder={placeholder}
                  value={ex[key]}
                  onInput={(e) => updateField(key, (e.target as HTMLInputElement).value)}
                />
              </div>
            ))}
            <div class="col-span-2">
              <label class="text-[10px] text-nodo-muted font-semibold uppercase tracking-wider block mb-0.5">Descripcion</label>
              <textarea
                class="w-full bg-nodo-dark border border-nodo-border rounded-lg px-3 py-2 text-sm text-white resize-none"
                rows={3}
                placeholder="Descripcion, detalles fisicos, ropa..."
                value={ex.description}
                onInput={(e) => updateField('description', (e.target as HTMLTextAreaElement).value)}
              />
            </div>
          </div>

          <div class="flex gap-2">
            <Button fullWidth onClick={handleSearchFromExtracted} disabled={!ex.firstName && !ex.lastName}>
              Buscar en NODO
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>

        {(ex.firstName || ex.lastName) && (
          <SharePanel
            name={[ex.firstName, ex.lastName].filter(Boolean).join(' ')}
            description={ex.description}
            photoUrl={ex.photoUrl}
          />
        )}
      </div>
    )
  }

  // idle
  return (
    <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-xl">📷</span>
        <div>
          <h4 class="text-sm font-bold text-white">Buscar mediante fotografia o flyer</h4>
          <p class="text-[11px] text-nodo-muted">Sube una foto, flyer o captura. La IA extraera los datos automaticamente.</p>
        </div>
      </div>
      <label class="flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-dashed border-nodo-border rounded-xl py-3 text-sm font-semibold text-nodo-muted cursor-pointer transition-colors active:scale-[0.97]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Subir imagen
        <input type="file" accept="image/*" class="hidden" onChange={handleFile} />
      </label>
    </div>
  )
}

// --- Intent detection ---
type SearchIntent = 'persona' | 'mascota' | 'hospital' | 'refugio' | 'sangre' | 'acopio' | 'campana' | 'incidente' | 'general'

const INTENT_ROUTES: Record<SearchIntent, string | null> = {
  persona: null,
  mascota: null,
  hospital: null,
  refugio: '/refugios',
  sangre: null,
  acopio: '/centros-acopio',
  campana: '/campanas',
  incidente: '/mapa',
  general: null,
}

const INTENT_LABELS: Record<SearchIntent, string> = {
  persona: 'Buscando persona',
  mascota: 'Buscando mascota',
  hospital: 'Buscando hospital',
  refugio: 'Buscando refugio',
  sangre: 'Buscando donante de sangre',
  acopio: 'Buscando centro de acopio',
  campana: 'Buscando campana',
  incidente: 'Buscando incidente',
  general: 'Buscando',
}

function detectIntent(q: string): SearchIntent {
  const n = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/\b(perro|gato|mascota|animal|gatito|perrito|patitas)\b/.test(n)) return 'mascota'
  if (/\b(hospital|clinica|centro medico|ambulatorio|emergencia medica)\b/.test(n)) return 'hospital'
  if (/\b(refugio|albergue|hospedaje|alojamiento)\b/.test(n)) return 'refugio'
  if (/\b(sangre|donante|donacion|hemocentro|plaquetas|grupo sanguineo)\b/.test(n)) return 'sangre'
  if (/\b(acopio|donacion|insumos|centro de acopio|donativos)\b/.test(n)) return 'acopio'
  if (/\b(campana|jornada|vacunacion|convocatoria)\b/.test(n)) return 'campana'
  if (/\b(incidente|derrumbe|explosion|incendio|inundacion|colapso|via cerrada)\b/.test(n)) return 'incidente'
  return 'persona'
}

// --- Search status summary (Red NODO status) ---
function SearchStatusSummary({ totalResults, nodoCount, responses, intent }: {
  totalResults: number; nodoCount: number; responses: ConnectorResponse[]; intent: SearchIntent
}) {
  const connectors = getRegisteredConnectors()
  const activeCount = connectors.filter(c => c.enabled).length
  const respondedCount = responses.length
  const errorCount = responses.filter(r => r.error).length
  const cacheCount = responses.filter(r => r.fromCache).length
  const responseTimes = responses.filter(r => r.responseTimeMs > 0)
  const avgMs = responseTimes.length > 0 ? Math.round(responseTimes.reduce((s, r) => s + r.responseTimeMs, 0) / responseTimes.length) : 0

  return (
    <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-base">🌐</span>
        <h4 class="text-sm font-bold text-white">Estado de la Red NODO</h4>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: totalResults > 0 ? '#22c55e' : '#94a3b8', display: 'inline-block' }} />
          <span class="text-[12px] text-white/80">
            <strong>{totalResults}</strong> resultado{totalResults === 1 ? '' : 's'} en toda la Red
          </span>
        </div>

        {nodoCount > 0 && (
          <div class="flex items-center gap-2">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            <span class="text-[12px] text-white/80">
              <strong>{nodoCount}</strong> de NODO Supabase
            </span>
          </div>
        )}

        <div class="flex items-center gap-2">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: errorCount > 0 ? '#eab308' : '#22c55e', display: 'inline-block' }} />
          <span class="text-[12px] text-white/80">
            <strong>{respondedCount - errorCount}</strong>/{activeCount} nodos respondieron{avgMs > 0 ? ` · ${avgMs}ms` : ''}
            {cacheCount > 0 && <span class="text-nodo-muted"> ({cacheCount} cache)</span>}
          </span>
        </div>

        {errorCount > 0 && (
          <div class="flex items-center gap-2">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span class="text-[12px] text-white/80">
              <strong>{errorCount}</strong> nodo{errorCount === 1 ? '' : 's'} no respondio
            </span>
          </div>
        )}
      </div>

      {intent !== 'persona' && (
        <div class="mt-3 pt-3 border-t border-nodo-border">
          <p class="text-[11px] text-nodo-muted">
            Detectamos: <strong class="text-white">{INTENT_LABELS[intent]}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

// --- localStorage helpers for favorites & follows ---
const SAVED_KEY = 'nodo_saved_searches'
const FOLLOWED_KEY = 'nodo_followed_searches'

interface SavedSearch {
  query: string
  date: string
}

function getSavedSearches(): SavedSearch[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') } catch { return [] }
}

function saveSearch(q: string) {
  const saved = getSavedSearches().filter(s => s.query !== q)
  saved.unshift({ query: q, date: new Date().toISOString() })
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved.slice(0, 20)))
}

function removeSavedSearch(q: string) {
  const saved = getSavedSearches().filter(s => s.query !== q)
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
}

function isSearchSaved(q: string): boolean {
  return getSavedSearches().some(s => s.query === q)
}

function getFollowedSearches(): SavedSearch[] {
  try { return JSON.parse(localStorage.getItem(FOLLOWED_KEY) || '[]') } catch { return [] }
}

function followSearch(q: string) {
  const followed = getFollowedSearches().filter(s => s.query !== q)
  followed.unshift({ query: q, date: new Date().toISOString() })
  localStorage.setItem(FOLLOWED_KEY, JSON.stringify(followed.slice(0, 20)))
}

function isSearchFollowed(q: string): boolean {
  return getFollowedSearches().some(s => s.query === q)
}

// --- Main component ---
export function SearchPerson() {
  const { route } = useLocation()
  const query = useSignal('')
  const results = useSignal<Person[]>([])
  const matches = useSignal<MatchCandidate[]>([])
  const activeProfile = useSignal<UnifiedProfile | null>(null)
  const activeTimeline = useSignal<TimelineEvent[] | null>(null)
  const loading = useSignal(false)
  const searched = useSignal(false)
  const searchError = useSignal<string | null>(null)
  const lastExtracted = useSignal<ExtractedPerson | null>(null)
  const detectedIntent = useSignal<SearchIntent>('persona')
  const isSaved = useSignal(false)
  const isFollowed = useSignal(false)
  const showSavedList = useSignal(false)
  const connectorResults = useSignal<FederatedResult[]>([])
  const connectorResponses = useSignal<ConnectorResponse[]>([])
  const evidenceReports = useSignal<EvidenceReport[]>([])
  const humanIndex = useSignal<HumanitarianSummary | null>(null)
  const humanContext = useSignal<HCtxType | null>(null)
  const brief = useSignal<BriefType | null>(null)
  const connectorsInitialized = useSignal(false)
  const nodoResultCount = useSignal(0)

  if (!connectorsInitialized.value) {
    initConnectors()
    connectorsInitialized.value = true
  }

  const personToFederated = (p: Person): FederatedResult => ({
    id: `nodo-${p.id}`,
    providerId: 'nodo',
    providerName: 'NODO',
    entityType: 'person',
    firstName: p.first_name,
    lastName: p.last_name || '',
    age: p.approximate_age ?? null,
    status: p.current_status,
    city: p.city || '',
    lastLocation: p.last_known_address || p.sector || '',
    photoUrl: ((p.metadata?.images as string[]) || [])[0] || p.photo_url || null,
    phone: (p.metadata?.contact_phone as string) || null,
    description: p.description || '',
    sourceUrl: null,
    retrievedAt: p.updated_at || p.created_at,
    metadata: { nodoId: p.id, hospital: p.metadata?.hospital },
  })

  const doSearch = async (q: string, ext?: ExtractedPerson) => {
    if (!q) return

    const intent = detectIntent(q)
    detectedIntent.value = intent

    const redirectRoute = INTENT_ROUTES[intent]
    if (redirectRoute) {
      route(redirectRoute)
      return
    }

    loading.value = true
    searched.value = true
    searchError.value = null
    activeProfile.value = null
    activeTimeline.value = null
    isSaved.value = isSearchSaved(q)
    isFollowed.value = isSearchFollowed(q)
    connectorResults.value = []
    connectorResponses.value = []
    evidenceReports.value = []
    humanIndex.value = null
    humanContext.value = null
    brief.value = null
    nodoResultCount.value = 0

    const sanitize = (s: string) => s.replace(/[%_.,()\\,*]/g, '')
    const terms = q.split(/\s+/).map(sanitize).filter(Boolean)
    if (terms.length === 0) { loading.value = false; return }

    const nodoSearch = async (): Promise<Person[]> => {
      if (!supabase) return []
      try {
        let dbQuery = supabase.from('persons').select('*')
        if (terms.length >= 2) {
          dbQuery = dbQuery.ilike('first_name', `%${terms[0]}%`).ilike('last_name', `%${terms[1]}%`)
        } else {
          dbQuery = dbQuery.or(`first_name.ilike.%${terms[0]}%,last_name.ilike.%${terms[0]}%`)
        }
        const { data, error } = await dbQuery.order('updated_at', { ascending: false }).limit(50)
        if (error) throw error
        return (data ?? []) as Person[]
      } catch { return [] }
    }

    try {
      const [persons, federation] = await Promise.all([
        nodoSearch(),
        adaptiveSearch(q, () => 0),
      ])

      results.value = persons
      nodoResultCount.value = persons.length
      connectorResponses.value = federation.responses

      if (ext && persons.length > 0) {
        matches.value = findMatches(buildMatchQuery(ext), persons, 25)
      } else if (persons.length > 1) {
        const mq: { firstName?: string; lastName?: string } = {}
        if (terms[0]) mq.firstName = terms[0]
        if (terms[1]) mq.lastName = terms[1]
        matches.value = findMatches(buildMatchQuery(mq), persons, 25)
      } else {
        matches.value = []
      }

      const nodoFederated = persons.map(personToFederated)
      const allMerged = deduplicateResults([...nodoFederated, ...federation.allResults])
      connectorResults.value = allMerged

      const personResults = allMerged.filter(r => r.entityType === 'person')
      if (personResults.length > 0) {
        const bestMatch = matches.value.length > 0 ? matches.value[0].score : 0
        evidenceReports.value = [
          ...buildEvidenceFromFederated(personResults, persons, bestMatch),
          ...buildEntityEvidence(allMerged.filter(r => r.entityType !== 'person')),
        ]
      }

      if (allMerged.length > 0) {
        humanIndex.value = buildHumanitarianIndex(q, allMerged)
      }

      const subjects = allMerged.filter(r => r.entityType === 'person' || r.entityType === 'pet')
      humanContext.value = buildContext(subjects, allMerged, evidenceReports.value, q)

      brief.value = buildBrief(q, allMerged, evidenceReports.value, humanContext.value, humanIndex.value)
    } catch {
      results.value = []
      matches.value = []
      searchError.value = 'Error buscando en la Red NODO. Intente de nuevo.'
    } finally {
      loading.value = false
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')?.trim()
    if (q) {
      query.value = q
      doSearch(q)
    }
  }, [])

  const handleSearch = async (e: Event) => {
    e.preventDefault()
    lastExtracted.value = null
    await doSearch(query.value.trim())
  }

  const handleAiSearch = async (firstName: string, lastName: string, ext: ExtractedPerson) => {
    const q = [firstName, lastName].filter(Boolean).join(' ')
    if (q) {
      query.value = q
      lastExtracted.value = ext
      await doSearch(q, ext)
    }
  }

  const openProfile = async (personId: string) => {
    if (!supabase) return
    const person = results.value.find(p => p.id === personId)
    if (!person) return

    const { data: hist } = await supabase
      .from('person_status_history')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false })

    const history = (hist ?? []) as PersonStatusHistory[]
    const timeline = buildTimeline(person, history)
    const otherMatches = matches.value.filter(m => m.person.id !== personId)
    const profile = buildProfile(person, timeline, otherMatches)

    activeProfile.value = profile
    activeTimeline.value = null
  }

  const trimmedQuery = query.value.trim()

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div class="flex items-center gap-3 mb-2">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 class="text-lg font-bold flex items-center gap-2">
            <span>🌐</span> Red NODO
          </h2>
          <p class="text-[10px] text-nodo-muted font-semibold uppercase tracking-wider">Centro Nacional de Busqueda Colaborativa</p>
        </div>
      </div>

      <div class="mb-5 pl-12">
        <p class="text-[13px] text-white/80 leading-relaxed">
          NODO conecta bases de datos y plataformas verificadas para ampliar la busqueda de personas desaparecidas, encontradas y a salvo.
        </p>
        <p class="text-[11px] text-nodo-muted mt-1.5 leading-relaxed">
          Realiza una sola busqueda y accede rapidamente a la informacion disponible en NODO y en plataformas colaboradoras verificadas.
        </p>
      </div>

      {/* Search form */}
      <form class="mb-4" onSubmit={handleSearch}>
        <div class="flex gap-2">
          <input
            type="text"
            class="flex-1 bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
            placeholder="A quien o que estas buscando?"
            value={query.value}
            onInput={(e) => { query.value = (e.target as HTMLInputElement).value }}
            autoFocus
          />
          <Button type="submit" loading={loading.value} disabled={!trimmedQuery}>
            Buscar
          </Button>
        </div>
      </form>

      {/* AI photo search */}
      <AiExtractPanel onSearch={handleAiSearch} />

      {/* Report found person */}
      <button
        class="w-full bg-amber-800/40 hover:bg-amber-800/60 border border-amber-700/40 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 transition-colors active:scale-[0.98]"
        onClick={() => route('/reportar-persona')}
      >
        <span class="text-xl">📢</span>
        <div class="text-left">
          <span class="text-sm font-semibold block">Reportar persona encontrada</span>
          <span class="text-xs text-nodo-muted">Ayuda a que sus familiares la localicen</span>
        </div>
      </button>

      {loading.value && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-5 mb-4">
          <div class="flex items-center gap-3">
            <Spinner size={20} />
            <span class="text-sm font-semibold text-white">Buscando en la Red NODO...</span>
          </div>
        </div>
      )}

      {searchError.value && (
        <div class="text-center py-4">
          <p class="text-red-400 text-sm">{searchError.value}</p>
        </div>
      )}

      {/* Active profile view */}
      {activeProfile.value && (
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-bold text-white">Ficha unificada</span>
            <button onClick={() => { activeProfile.value = null; activeTimeline.value = null }} class="text-[11px] text-blue-400 font-semibold">
              Volver a resultados
            </button>
          </div>
          <ProfileCard
            profile={activeProfile.value}
            onViewTimeline={() => { activeTimeline.value = activeProfile.value!.timeline }}
          />
          {activeTimeline.value && (
            <TimelineView events={activeTimeline.value} onClose={() => { activeTimeline.value = null }} />
          )}
          <div class="flex gap-2">
            <Button fullWidth onClick={() => route(`/detalle/person/${activeProfile.value!.primaryId}`)}>
              Ver detalle completo
            </Button>
          </div>
        </div>
      )}

      {/* Humanitarian Brief — executive summary */}
      {!loading.value && searched.value && brief.value && !activeProfile.value && (
        <HumanitarianBriefPanel brief={brief.value} />
      )}

      {/* Verification alert for AI searches with matches */}
      {!loading.value && searched.value && lastExtracted.value && matches.value.length > 0 && !activeProfile.value && (
        <VerificationAlert
          matches={matches.value}
          onView={(id) => openProfile(id)}
          onDismiss={() => { matches.value = [] }}
        />
      )}

      {/* Humanitarian Index */}
      {!loading.value && searched.value &&humanIndex.value && humanIndex.value.categories.length > 1 && !activeProfile.value && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-base">🌐</span>
            <h4 class="text-sm font-bold text-white">Indice Humanitario</h4>
            <span class="text-[10px] text-nodo-muted">{humanIndex.value.totalResults} resultados</span>
          </div>
          <div class="grid grid-cols-3 gap-2 mb-3">
            {humanIndex.value.categories.map(cat => (
              <div key={cat.entityType} class="bg-white/[0.04] rounded-lg p-2 text-center">
                <div class="text-sm mb-0.5">{cat.icon}</div>
                <div class="text-base font-bold text-white">{cat.count}</div>
                <div class="text-[9px] text-nodo-muted leading-tight">{cat.label}</div>
              </div>
            ))}
          </div>
          <div class="flex flex-wrap gap-1">
            <span class="text-[9px] text-nodo-muted">Fuentes:</span>
            {humanIndex.value.sources.map(s => (
              <span key={s} class="text-[9px] bg-white/[0.06] text-white/60 px-1.5 py-0.5 rounded">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Unified person results from all sources */}
      {!loading.value && searched.value && connectorResults.value.filter(r => r.entityType === 'person').length > 0 && !activeProfile.value && (() => {
        const personResults = connectorResults.value.filter(r => r.entityType === 'person')
        const providers = [...new Set(personResults.map(r => r.providerName))]
        const statusColors: Record<string, string> = { missing: '#ef4444', found: '#22c55e', hospitalized: '#3b82f6', safe: '#10b981', reunited: '#ec4899', deceased: '#6b7280' }
        const statusLabels: Record<string, string> = { missing: 'Desaparecido/a', found: 'Encontrado/a', hospitalized: 'Hospitalizado/a', safe: 'A salvo', reunited: 'Reunido/a', deceased: 'Fallecido/a' }
        return (
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm">👤</span>
              <span class="text-sm font-bold text-white">Personas</span>
              <span class="text-[10px] font-semibold bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                {personResults.length}
              </span>
            </div>
            <p class="text-[10px] text-nodo-muted mb-3">
              {providers.join(' · ')}
            </p>
            <div class="space-y-2">
              {personResults.map(p => {
                const meta = p.metadata || {}
                const nodoId = meta.nodoId as string | undefined
                const matchInfo = nodoId ? matches.value.find(m => m.person.id === nodoId) : null
                const color = statusColors[p.status] || '#94a3b8'
                return (
                  <div
                    key={p.id}
                    class={`bg-nodo-card border border-nodo-border rounded-xl p-3 ${nodoId ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                    onClick={nodoId ? () => openProfile(nodoId) : undefined}
                  >
                    {p.photoUrl && (
                      <img src={p.photoUrl} class="w-full h-28 object-cover rounded-lg mb-2" alt={`${p.firstName} ${p.lastName}`} />
                    )}
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <h4 class="text-[13px] font-bold text-white leading-tight">
                          {p.firstName} {p.lastName}
                        </h4>
                        {p.age && <span class="text-[11px] text-nodo-muted">~{p.age} anos</span>}
                        {p.city && (
                          <p class="text-[11px] text-nodo-muted mt-0.5">
                            {p.lastLocation ? `${p.lastLocation} · ` : ''}{p.city}{meta.state ? `, ${meta.state as string}` : ''}
                          </p>
                        )}
                        {(meta.hospital as string) && (
                          <p class="text-[11px] text-blue-400 mt-0.5">🏥 {meta.hospital as string}</p>
                        )}
                        {p.description && (
                          <p class="text-[10px] text-white/50 mt-1 line-clamp-2">{p.description}</p>
                        )}
                      </div>
                      <div class="flex flex-col items-end gap-1 flex-shrink-0">
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color, background: `${color}18` }}>
                          {statusLabels[p.status] || p.status}
                        </span>
                        {matchInfo && <MatchBadge score={matchInfo.score} />}
                        <span class="text-[9px] text-nodo-muted">{p.providerName}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {!lastExtracted.value && trimmedQuery && (
              <div class="mt-3">
                <SharePanel name={trimmedQuery} />
              </div>
            )}
          </div>
        )
      })()}

      {/* Evidence reports */}
      {!loading.value && searched.value &&evidenceReports.value.length > 0 && !activeProfile.value && (
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm">🛡️</span>
            <span class="text-sm font-bold text-white">Verificacion multi-fuente</span>
          </div>
          <div class="space-y-2">
            {evidenceReports.value.map(report => {
              const cfg = EVIDENCE_CONFIG[report.evidenceLevel]
              return (
                <div key={report.personKey} class="bg-nodo-card border border-nodo-border rounded-xl p-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <h4 class="text-[13px] font-bold text-white">{report.firstName} {report.lastName}</h4>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div class="flex flex-wrap gap-1 mt-2">
                        {report.sources.map((s, i) => (
                          <span key={`${s.providerId}-${i}`} class="text-[9px] bg-white/[0.06] text-white/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.confidence === 'high' ? '#22c55e' : s.confidence === 'medium' ? '#eab308' : '#94a3b8', display: 'inline-block' }} />
                            {s.providerName}
                          </span>
                        ))}
                      </div>
                      {report.recommendation && (
                        <p class="text-[10px] text-amber-400/80 mt-1.5">{report.recommendation}</p>
                      )}
                    </div>
                    <div class="flex flex-col items-end gap-1 flex-shrink-0">
                      <span class="text-[10px] font-bold" style={{ color: cfg.color }}>{report.sourceCount} fuente{report.sourceCount === 1 ? '' : 's'}</span>
                      <span class="text-[9px] text-nodo-muted">{report.staleness}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Humanitarian context */}
      {!loading.value && searched.value &&humanContext.value && !activeProfile.value && (
        <HumanitarianContextPanel context={humanContext.value} />
      )}

      {/* Connector: hospital results */}
      {!loading.value && searched.value &&connectorResults.value.filter(r => r.entityType === 'hospital').length > 0 && !activeProfile.value && (() => {
        const hospitalResults = connectorResults.value.filter(r => r.entityType === 'hospital')
        return (
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm">🏥</span>
              <span class="text-sm font-bold text-white">Hospitales encontrados</span>
              <span class="text-[10px] font-semibold bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">
                {hospitalResults.length}
              </span>
            </div>
            <div class="space-y-2">
              {hospitalResults.map(h => {
                const meta = h.metadata || {}
                return (
                  <div key={h.id} class="bg-nodo-card border border-nodo-border rounded-xl p-3">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <h4 class="text-[13px] font-bold text-white leading-tight">{h.firstName}</h4>
                        <p class="text-[11px] text-purple-400 mt-0.5">{meta.hospitalType as string || ''}</p>
                        <p class="text-[11px] text-nodo-muted mt-1">{h.lastLocation} · {h.city}, {meta.state as string || ''}</p>
                        {h.phone && (
                          <a href={`tel:${h.phone}`} class="text-[11px] text-blue-400 mt-0.5 block">
                            {(meta.phones as string[] || [h.phone]).join(' / ')}
                          </a>
                        )}
                        {(meta.services as string[])?.length > 0 && (
                          <div class="flex flex-wrap gap-1 mt-1.5">
                            {(meta.services as string[]).slice(0, 5).map(s => (
                              <span key={s} class="text-[9px] bg-white/[0.06] text-white/60 px-1.5 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                            {(meta.services as string[]).length > 5 && (
                              <span class="text-[9px] text-nodo-muted">+{(meta.services as string[]).length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span class="text-[9px] text-nodo-muted flex-shrink-0 mt-0.5">{meta.schedule as string || ''}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Connector: shelter results */}
      {!loading.value && searched.value &&connectorResults.value.filter(r => r.entityType === 'shelter').length > 0 && !activeProfile.value && (() => {
        const shelterResults = connectorResults.value.filter(r => r.entityType === 'shelter')
        return (
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm">🏠</span>
              <span class="text-sm font-bold text-white">Refugios</span>
              <span class="text-[10px] font-semibold bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">{shelterResults.length}</span>
            </div>
            <div class="space-y-2">
              {shelterResults.map(s => {
                const meta = s.metadata || {}
                return (
                  <div key={s.id} class="bg-nodo-card border border-nodo-border rounded-xl p-3">
                    <h4 class="text-[13px] font-bold text-white">{s.firstName}</h4>
                    <p class="text-[11px] text-nodo-muted mt-0.5">{s.lastLocation} · {s.city}</p>
                    {meta.capacity && (
                      <p class="text-[10px] text-blue-400 mt-0.5">
                        Capacidad: {meta.currentOccupancy as number}/{meta.capacity as number}
                      </p>
                    )}
                    {s.phone && <a href={`tel:${s.phone}`} class="text-[11px] text-blue-400 block mt-0.5">{s.phone}</a>}
                    {s.description && <p class="text-[10px] text-white/50 mt-1">{s.description}</p>}
                    <span class="text-[9px] text-nodo-muted">{s.providerName}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Connector: resource/campaign results */}
      {!loading.value && searched.value &&connectorResults.value.filter(r => r.entityType === 'resource').length > 0 && !activeProfile.value && (() => {
        const resourceResults = connectorResults.value.filter(r => r.entityType === 'resource')
        return (
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm">📦</span>
              <span class="text-sm font-bold text-white">Recursos y campanas</span>
              <span class="text-[10px] font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">{resourceResults.length}</span>
            </div>
            <div class="space-y-2">
              {resourceResults.map(r => (
                <div key={r.id} class="bg-nodo-card border border-nodo-border rounded-xl p-3">
                  <h4 class="text-[13px] font-bold text-white">{r.firstName}</h4>
                  <p class="text-[11px] text-nodo-muted mt-0.5">{r.lastLocation} · {r.city}</p>
                  {r.phone && <a href={`tel:${r.phone}`} class="text-[11px] text-blue-400 block mt-0.5">{r.phone}</a>}
                  {r.description && <p class="text-[10px] text-white/50 mt-1">{r.description}</p>}
                  <span class="text-[9px] text-nodo-muted">{r.providerName}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Connector: pet results */}
      {!loading.value && searched.value &&connectorResults.value.filter(r => r.entityType === 'pet').length > 0 && !activeProfile.value && (() => {
        const petResults = connectorResults.value.filter(r => r.entityType === 'pet')
        const statusColors: Record<string, string> = { missing: '#ef4444', found: '#22c55e', reunited: '#ec4899', shelter: '#8b5cf6' }
        const statusLabels: Record<string, string> = { missing: 'Perdido/a', found: 'Encontrado/a', reunited: 'Reunido/a', shelter: 'En refugio' }
        return (
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm">🐾</span>
              <span class="text-sm font-bold text-white">Mascotas</span>
              <span class="text-[10px] font-semibold bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">{petResults.length}</span>
            </div>
            <div class="space-y-2">
              {petResults.map(p => {
                const meta = p.metadata || {}
                const color = statusColors[p.status] || '#94a3b8'
                return (
                  <div key={p.id} class="bg-nodo-card border border-nodo-border rounded-xl p-3">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <h4 class="text-[13px] font-bold text-white">{p.firstName}</h4>
                        <p class="text-[11px] text-purple-400 mt-0.5">
                          {[meta.species, meta.breed, meta.sex, meta.color].filter(Boolean).join(' · ')}
                        </p>
                        {p.age && <span class="text-[10px] text-nodo-muted">~{p.age} anos</span>}
                        <p class="text-[11px] text-nodo-muted mt-0.5">{p.lastLocation} · {p.city}</p>
                        {p.phone && <a href={`tel:${p.phone}`} class="text-[11px] text-blue-400 block mt-0.5">{p.phone}</a>}
                        {p.description && <p class="text-[10px] text-white/50 mt-1 line-clamp-2">{p.description}</p>}
                        {(meta.collar as string) && <span class="text-[9px] text-amber-400">Collar: {meta.collar as string}</span>}
                        {meta.chip && <span class="text-[9px] text-green-400 ml-2">Con chip</span>}
                      </div>
                      <div class="flex flex-col items-end gap-1 flex-shrink-0">
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color, background: `${color}18` }}>
                          {statusLabels[p.status] || p.status}
                        </span>
                        <span class="text-[9px] text-nodo-muted">{p.providerName}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Connector errors are now shown in SearchStatusSummary */}

      {/* Red NODO search status */}
      {!loading.value && searched.value && !searchError.value && !activeProfile.value && (
        <SearchStatusSummary
          totalResults={connectorResults.value.length}
          nodoCount={nodoResultCount.value}
          responses={connectorResponses.value}
          intent={detectedIntent.value}
        />
      )}

      {/* Save & Follow buttons */}
      {!loading.value && searched.value && trimmedQuery && !activeProfile.value && (
        <div class="flex gap-2 mb-4">
          <button
            onClick={() => {
              if (isSaved.value) { removeSavedSearch(trimmedQuery); isSaved.value = false }
              else { saveSearch(trimmedQuery); isSaved.value = true }
            }}
            class={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.97] border ${isSaved.value ? 'bg-amber-600/20 border-amber-600/40 text-amber-400' : 'bg-nodo-card border-nodo-border text-white/80 hover:bg-white/[0.06]'}`}
          >
            <span>{isSaved.value ? '★' : '☆'}</span>
            {isSaved.value ? 'Guardada' : 'Guardar busqueda'}
          </button>
          <button
            onClick={() => {
              if (!isFollowed.value) { followSearch(trimmedQuery); isFollowed.value = true }
            }}
            class={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.97] border ${isFollowed.value ? 'bg-blue-600/20 border-blue-600/40 text-blue-400' : 'bg-nodo-card border-nodo-border text-white/80 hover:bg-white/[0.06]'}`}
          >
            <span>🔔</span>
            {isFollowed.value ? 'Siguiendo' : 'Seguir busqueda'}
          </button>
        </div>
      )}

      {/* Follow prompt */}
      {!loading.value && searched.value && trimmedQuery && !isFollowed.value && !activeProfile.value && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
          <p class="text-[12px] text-white/80 mb-2">Quieres que NODO continue siguiendo este caso?</p>
          <button
            onClick={() => { followSearch(trimmedQuery); isFollowed.value = true }}
            class="bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-semibold rounded-lg px-4 py-2 transition-colors active:scale-[0.97]"
          >
            🔔 Seguir busqueda
          </button>
        </div>
      )}

      {/* Share when no person results found */}
      {!loading.value && searched.value && connectorResults.value.filter(r => r.entityType === 'person').length === 0 && !searchError.value && trimmedQuery && !activeProfile.value && (
        <SharePanel
          name={trimmedQuery}
          description={lastExtracted.value?.description}
          photoUrl={lastExtracted.value?.photoUrl}
        />
      )}

      {/* Saved searches */}
      <div class="mb-4">
        <button
          onClick={() => { showSavedList.value = !showSavedList.value }}
          class="flex items-center gap-2 text-[12px] font-semibold text-nodo-muted hover:text-white transition-colors mb-2"
        >
          <span>★</span> Busquedas guardadas
          <span class="text-[10px]">({getSavedSearches().length})</span>
        </button>
        {showSavedList.value && (
          <div class="bg-nodo-card border border-nodo-border rounded-xl overflow-hidden">
            {getSavedSearches().length === 0 ? (
              <p class="text-[11px] text-nodo-muted p-3">No tienes busquedas guardadas.</p>
            ) : (
              getSavedSearches().map(s => (
                <button
                  key={s.query}
                  onClick={() => { query.value = s.query; doSearch(s.query) }}
                  class="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.04] transition-colors border-b border-nodo-border last:border-0"
                >
                  <span class="text-[12px] text-white/80 truncate">{s.query}</span>
                  <span class="text-[10px] text-nodo-muted flex-shrink-0 ml-2">
                    {new Date(s.date).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Federated Nodes status */}
      <FederatedNodesPanel />

      {/* Federation: always visible */}
      <FederationSection query={searched.value ? trimmedQuery : ''} />
    </div>
  )
}
