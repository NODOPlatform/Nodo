import { getConfig } from '../lib/admin-config'

const LEVEL_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  emergency_national: { bg: 'rgba(220, 38, 38, 0.15)', border: 'rgba(220, 38, 38, 0.4)', text: '#fca5a5', glow: 'rgba(220, 38, 38, 0.08)' },
  emergency_regional: { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.35)', text: '#fdba74', glow: 'rgba(249, 115, 22, 0.06)' },
  alert_yellow: { bg: 'rgba(234, 179, 8, 0.10)', border: 'rgba(234, 179, 8, 0.30)', text: '#fde047', glow: 'rgba(234, 179, 8, 0.05)' },
  info_official: { bg: 'rgba(59, 130, 246, 0.10)', border: 'rgba(59, 130, 246, 0.30)', text: '#93c5fd', glow: 'rgba(59, 130, 246, 0.05)' },
  ended: { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.25)', text: '#86efac', glow: 'rgba(34, 197, 94, 0.04)' },
  drill: { bg: 'rgba(139, 92, 246, 0.10)', border: 'rgba(139, 92, 246, 0.30)', text: '#c4b5fd', glow: 'rgba(139, 92, 246, 0.05)' },
}

export function NationalBanner() {
  const config = getConfig()
  const banner = config.nationalBanner

  if (!banner || !banner.active) return null

  if (banner.endDate) {
    const end = new Date(banner.endDate + 'T23:59:59')
    if (end < new Date()) return null
  }

  const style = LEVEL_STYLES[banner.level] || LEVEL_STYLES.emergency_national
  const isPulsing = banner.level === 'emergency_national' || banner.level === 'emergency_regional'

  return (
    <div class="mx-4 mt-3 mb-1 animate-fade-in">
      <div
        class="rounded-2xl border px-4 py-3.5 relative overflow-hidden"
        style={{ background: style.bg, borderColor: style.border, boxShadow: `0 0 40px ${style.glow}` }}
      >
        {/* Scan line effect for emergency levels */}
        {isPulsing && (
          <div
            class="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${style.glow} 50%, transparent 100%)`,
              backgroundSize: '100% 200%',
              animation: 'banner-scan 3s ease-in-out infinite',
            }}
          />
        )}

        <div class="relative flex items-start gap-3">
          <div class="flex-shrink-0 text-2xl mt-0.5">
            {banner.icon || '🚨'}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              {isPulsing && (
                <span
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: style.text, animation: 'pulse-dot 2s ease-in-out infinite' }}
                />
              )}
              <span class="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.text }}>
                {banner.country || 'Venezuela'}
              </span>
            </div>
            <h1 class="text-[15px] font-extrabold leading-tight" style={{ color: style.text }}>
              {banner.text}
            </h1>
            {banner.subtitle && (
              <p class="text-[11px] mt-1 leading-snug" style={{ color: `${style.text}99` }}>
                {banner.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
