import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { NationalBanner } from '../components/NationalBanner'
import { SeismicTicker } from '../components/SeismicTicker'
import { CoordinationCenter } from '../components/CoordinationCenter'
import { HomeMiniMap } from '../components/HomeMiniMap'
import { NationalFeed } from '../components/NationalFeed'
import { NationalIntelligence } from '../components/NationalIntelligence'
import { MissionOfTheDay } from '../components/MissionOfTheDay'
import { PriorityNeeds } from '../components/PriorityNeeds'
import { IconSOS, IconHeart, IconSearch, IconAlert, IconMapPin, IconPhone, IconBuilding, IconBox, IconInfo, IconShare } from '../components/ui/Icons'
import { liveStats, loadLiveStats, statsLoaded } from '../store/live-stats'
import { getActiveProviders } from '../lib/red-nodo'
import type { ComponentType } from 'preact'

interface ActionItem {
  path: string
  label: string
  Icon: ComponentType<{ size?: number; class?: string }>
  bg: string
}

const MAIN_ACTIONS: ActionItem[] = [
  { path: '/buscar-persona', label: 'Buscar personas', Icon: IconSearch, bg: 'bg-gradient-to-br from-amber-600 to-amber-700' },
  { path: '/necesito-ayuda', label: 'Necesito ayuda', Icon: IconSOS, bg: 'bg-gradient-to-br from-red-600 to-red-700' },
  { path: '/quiero-ayudar', label: 'Quiero ayudar', Icon: IconHeart, bg: 'bg-gradient-to-br from-emerald-600 to-emerald-700' },
  { path: '/solicitud-salud', label: 'Solicitud de salud', Icon: IconHeart, bg: 'bg-gradient-to-br from-rose-600 to-rose-700' },
  { path: '/mapa', label: 'Ver mapa', Icon: IconMapPin, bg: 'bg-gradient-to-br from-blue-600 to-blue-700' },
]

interface QuickLink {
  path: string
  label: string
  Icon: ComponentType<{ size?: number; class?: string }>
}

const QUICK_LINKS: QuickLink[] = [
  { path: '/mapa', label: 'Mapa', Icon: IconMapPin },
  { path: '/emergencias', label: 'Emergencias', Icon: IconPhone },
  { path: '/refugios', label: 'Refugios', Icon: IconBuilding },
  { path: '/centros-acopio', label: 'Acopio', Icon: IconBox },
  { path: '/campanas', label: 'Campanas', Icon: IconAlert },
  { path: '/info', label: 'Info oficial', Icon: IconInfo },
  { path: '/colaborar', label: 'Colaborar', Icon: IconHeart },
  { path: '/acerca', label: 'Acerca de', Icon: IconInfo },
]

const SHARE_URL = 'https://nodoayuda.com'
const SHARE_TEXT = `🚨 Estamos usando NODO para coordinar ayuda durante la emergencia.\n\nSi necesitas ayuda o puedes ayudar entra aqui:\n\n${SHARE_URL}`

const SITUATION_ITEMS = [
  { key: 'requests' as const, icon: '🆘', label: 'Solicitudes activas', color: '#f59e0b', path: '/mapa?helpType=help_request' },
  { key: 'offers' as const, icon: '🤝', label: 'Personas ayudando', color: '#10b981', path: '/mapa?helpType=help_offer' },
  { key: 'healthRequests' as const, icon: '❤️', label: 'Solicitudes de salud', color: '#e11d48', path: '/solicitud-salud' },
  { key: 'shelters' as const, icon: '🏠', label: 'Refugios activos', color: '#8b5cf6', path: '/refugios' },
  { key: 'incidents' as const, icon: '🚨', label: 'Incidentes', color: '#ef4444', path: '/mapa?helpType=incident' },
  { key: 'collectionCenters' as const, icon: '📦', label: 'Centros de acopio', color: '#92400e', path: '/centros-acopio' },
  { key: 'personsFound' as const, icon: '👥', label: 'Personas encontradas', color: '#3b82f6', path: '/buscar-persona' },
  { key: 'campaigns' as const, icon: '📢', label: 'Campanas activas', color: '#8b5cf6', path: '/campanas' },
]

const UPDATES_ITEMS = [
  { key: 'personsFound' as const, icon: '🟢', label: 'Personas encontradas', path: '/buscar-persona', color: '#22c55e' },
  { key: 'healthRequests' as const, icon: '❤️', label: 'Solicitudes de sangre', path: '/solicitud-salud', color: '#e11d48' },
  { key: 'shelters' as const, icon: '🏠', label: 'Refugios activos', path: '/refugios', color: '#8b5cf6' },
  { key: 'collectionCenters' as const, icon: '📦', label: 'Centros de acopio', path: '/centros-acopio', color: '#92400e' },
  { key: 'campaigns' as const, icon: '📢', label: 'Campanas activas', path: '/campanas', color: '#8b5cf6' },
]

export function Home() {
  const { route } = useLocation()
  const copied = useSignal(false)
  const heroQuery = useSignal('')

  useEffect(() => {
    loadLiveStats()
    const interval = setInterval(loadLiveStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'NODO — Coordinacion Ciudadana', text: SHARE_TEXT, url: SHARE_URL }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(SHARE_TEXT)
        copied.value = true
        setTimeout(() => { copied.value = false }, 2500)
      } catch {}
    }
  }

  const stats = liveStats.value

  return (
    <div class="animate-fade-in pb-20 relative overflow-hidden">
      {/* Background texture */}
      <div
        class="lg:hidden absolute inset-x-0 top-0 h-[320px] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: 'url(/venezuela-network.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
          opacity: 0.06,
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
        }}
      />
      <div
        class="hidden lg:block absolute right-[-6%] top-[-8%] w-[55%] pointer-events-none"
        aria-hidden="true"
        style={{ minHeight: '115%' }}
      >
        <img
          src="/venezuela-network.webp" alt=""
          class="w-full h-auto animate-fade-in"
          style={{
            opacity: 0.5,
            maskImage: 'radial-gradient(ellipse 90% 85% at 50% 45%, black 40%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 45%, black 40%, transparent 75%)',
          }}
          loading="eager" decoding="async"
        />
      </div>

      <div class="relative z-10 lg:max-w-[55%]">
        {/* 1. Banner Nacional */}
        <NationalBanner />

        {/* 2. Ticker Sismico */}
        <div class="pt-2">
          <SeismicTicker />
        </div>

        {/* 3. Centro Nacional de Busqueda */}
        <div class="px-4 pt-4 pb-2">
          <div class="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-700/30 rounded-2xl p-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2 mb-1">
              <span>🔍</span> Centro Nacional de Busqueda
            </h2>
            <p class="text-[11px] text-amber-200/60 mb-3 leading-relaxed">
              Busca personas, mascotas, hospitales, refugios, campanas y recursos desde un solo lugar.
            </p>
            <form onSubmit={(e: Event) => { e.preventDefault(); const q = heroQuery.value.trim(); if (q) route(`/buscar-persona?q=${encodeURIComponent(q)}`) }}>
              <div class="flex gap-2">
                <input
                  type="text"
                  class="flex-1 bg-nodo-dark/80 border border-nodo-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nodo-muted"
                  placeholder="A quien o que estas buscando?"
                  value={heroQuery.value}
                  onInput={(e: Event) => { heroQuery.value = (e.target as HTMLInputElement).value }}
                />
                <button
                  type="submit"
                  class="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg px-4 py-2.5 text-sm transition-colors active:scale-[0.97]"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 4. Ultimas Actualizaciones */}
        {statsLoaded.value && (
          <div class="px-4 pb-2">
            <div class="bg-nodo-card border border-nodo-border rounded-2xl p-3">
              <h3 class="text-[11px] font-bold text-nodo-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span class="text-xs">📡</span> Ultimas actualizaciones
              </h3>
              <div class="space-y-1.5">
                {UPDATES_ITEMS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => route(item.path)}
                    class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors active:scale-[0.98]"
                  >
                    <span class="flex items-center gap-2 text-[12px] text-white/80">
                      <span>{item.icon}</span> {item.label}
                    </span>
                    <span class="text-sm font-bold" style={{ color: item.color }}>{stats[item.key]}</span>
                  </button>
                ))}
                <button
                  onClick={() => route('/buscar-persona')}
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors active:scale-[0.98]"
                >
                  <span class="flex items-center gap-2 text-[12px] text-white/80">
                    <span>🐾</span> Mascotas reportadas
                  </span>
                  <span class="text-sm font-bold text-purple-400">0</span>
                </button>
                <button
                  onClick={() => route('/situacion')}
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors active:scale-[0.98]"
                >
                  <span class="flex items-center gap-2 text-[12px] text-white/80">
                    <span>🌐</span> Centro Nacional de Situacion
                  </span>
                  <span class="text-sm font-bold text-blue-400">{getActiveProviders().length}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Centro de Situacion — Stats Grid */}
        {statsLoaded.value && (
          <div class="px-4 pb-1">
            <button
              onClick={() => route('/situacion')}
              class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider mb-2.5 flex items-center gap-2 hover:text-white transition-colors"
            >
              <span class="text-base">📊</span> Centro de situacion
              <span class="text-[9px] text-blue-400 normal-case font-semibold">Ver todo →</span>
            </button>
            <div class="grid grid-cols-4 gap-1.5">
              {SITUATION_ITEMS.map(item => (
                <button
                  key={item.key}
                  onClick={() => route(item.path)}
                  class="bg-nodo-card border border-nodo-border rounded-xl px-2 py-2 text-center transition-all duration-200 hover:bg-white/[0.06] active:scale-[0.95] cursor-pointer"
                >
                  <div class="text-sm mb-0.5">{item.icon}</div>
                  <div class="text-lg font-bold animate-fade-in" style={{ color: item.color }}>{stats[item.key]}</div>
                  <div class="text-[9px] text-nodo-muted leading-tight mt-0.5">{item.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Mision del Dia */}
        <MissionOfTheDay />

        {/* 5. Centro de Coordinacion Inteligente */}
        <div class="pt-3">
          <CoordinationCenter />
        </div>

        {/* 6. Inteligencia Operacional */}
        <NationalIntelligence />

        {/* 7. Mini Mapa */}
        <HomeMiniMap />

        {/* 6. Feed Nacional */}
        <NationalFeed />

        {/* 7. Acciones rapidas */}
        <div class="px-4 mb-3">
          <h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span class="text-base">⚡</span> Acciones rapidas
          </h2>
          <div class="grid grid-cols-2 gap-2 stagger">
            {MAIN_ACTIONS.map((action) => (
              <button
                key={action.path}
                class={`${action.bg} rounded-2xl p-3.5 flex flex-col items-center gap-2 text-white font-semibold shadow-lg shadow-black/20 transition-all duration-200 active:scale-[0.96] min-h-[100px] justify-center`}
                onClick={() => route(action.path)}
              >
                <action.Icon size={28} />
                <span class="text-[12px] leading-tight text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 8. Quick links — Plataformas */}
        <div class="scroll-fade px-4 pb-2 mb-1">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide quick-scroll sm:overflow-visible sm:flex-wrap">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.path}
                class="flex-shrink-0 sm:flex-shrink bg-nodo-card hover:bg-white/[0.08] border border-nodo-border rounded-xl py-2 px-3.5 flex items-center gap-2 text-nodo-text transition-all duration-200 active:scale-[0.97] shadow-sm shadow-black/10"
                onClick={() => route(link.path)}
              >
                <link.Icon size={14} />
                <span class="text-[11px] font-semibold whitespace-nowrap">{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 9. Compartir NODO */}
        <div class="px-4 mb-3">
          <button
            onClick={handleShare}
            class="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-blue-900/30 transition-all duration-200 active:scale-[0.97] hover:shadow-xl hover:shadow-blue-900/40"
          >
            <div class="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <IconShare size={24} class="text-white" />
            </div>
            <div class="text-left flex-1 min-w-0">
              <span class="text-[14px] font-bold text-white block">
                {copied.value ? 'Enlace copiado!' : 'Cada persona que comparte NODO puede ayudar a salvar vidas'}
              </span>
              <span class="text-[11px] text-blue-100/80 leading-snug block mt-0.5">Compartir ahora</span>
            </div>
          </button>
        </div>

        {/* 10. Necesidades prioritarias */}
        <div class="px-4">
          <PriorityNeeds />
        </div>
      </div>
    </div>
  )
}
