import { useSignal } from '@preact/signals'
import { getConfig, saveConfig, BANNER_LEVEL_PRESETS, type NationalBannerConfig, type BannerLevel } from '../../lib/admin-config'

const INPUT = 'w-full bg-nodo-dark border border-nodo-border rounded-xl p-3.5 text-white text-base min-h-[48px]'
const LABEL = 'block text-sm text-nodo-muted mb-1.5 font-medium'

export function BannerNacionalEditor() {
  const config = getConfig()
  const banner = useSignal<NationalBannerConfig>(config.nationalBanner || {
    active: true,
    level: 'emergency_national' as BannerLevel,
    icon: '🚨',
    text: 'Estado de Emergencia Nacional',
    subtitle: 'Coordinacion ciudadana activa.',
    country: 'Venezuela',
    startDate: '',
    endDate: '',
  })
  const saved = useSignal(false)

  const update = (field: keyof NationalBannerConfig, value: string | boolean) => {
    banner.value = { ...banner.value, [field]: value }
  }

  const applyPreset = (level: BannerLevel) => {
    const preset = BANNER_LEVEL_PRESETS.find(p => p.value === level)
    if (preset) {
      banner.value = { ...banner.value, level, icon: preset.icon }
    }
  }

  const persist = () => {
    const cfg = getConfig()
    saveConfig({ ...cfg, nationalBanner: banner.value })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  }

  return (
    <div class="space-y-4">
      {/* Active toggle */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
        <label class="flex items-center gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={banner.value.active}
            onChange={(e) => update('active', (e.target as HTMLInputElement).checked)}
            class="w-5 h-5 rounded"
          />
          <div>
            <span class="text-base font-medium block">Banner activo</span>
            <span class="text-xs text-nodo-muted">Se muestra en la parte superior de la Home</span>
          </div>
        </label>
      </div>

      {/* Level selector */}
      <div>
        <label class={LABEL}>Nivel de alerta</label>
        <div class="grid grid-cols-2 gap-2">
          {BANNER_LEVEL_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => applyPreset(preset.value)}
              class={`rounded-xl p-3 text-left border transition-all text-sm font-medium ${
                banner.value.level === preset.value
                  ? 'border-white/30 bg-white/[0.08]'
                  : 'border-nodo-border bg-nodo-card hover:bg-white/[0.04]'
              }`}
            >
              <span class="mr-2">{preset.icon}</span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Icon */}
      <div>
        <label class={LABEL}>Icono</label>
        <input class={`${INPUT} text-center text-2xl`} value={banner.value.icon} onInput={(e) => update('icon', (e.target as HTMLInputElement).value)} placeholder="🚨" style={{ maxWidth: '80px' }} />
      </div>

      {/* Country label */}
      <div>
        <label class={LABEL}>Pais / Region</label>
        <input class={INPUT} value={banner.value.country} onInput={(e) => update('country', (e.target as HTMLInputElement).value)} placeholder="Venezuela" />
      </div>

      {/* Main text */}
      <div>
        <label class={LABEL}>Texto principal</label>
        <input class={INPUT} value={banner.value.text} onInput={(e) => update('text', (e.target as HTMLInputElement).value)} placeholder="Estado de Emergencia Nacional" />
      </div>

      {/* Subtitle */}
      <div>
        <label class={LABEL}>Subtitulo</label>
        <textarea class={`${INPUT} min-h-[70px] resize-none`} value={banner.value.subtitle} onInput={(e) => update('subtitle', (e.target as HTMLTextAreaElement).value)} placeholder="Mensaje secundario..." />
      </div>

      {/* Dates */}
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class={LABEL}>Fecha inicio</label>
          <input type="date" class={INPUT} value={banner.value.startDate} onInput={(e) => update('startDate', (e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label class={LABEL}>Fecha fin</label>
          <input type="date" class={INPUT} value={banner.value.endDate} onInput={(e) => update('endDate', (e.target as HTMLInputElement).value)} />
          <span class="text-[10px] text-nodo-muted mt-1 block">Dejar vacio = sin fin</span>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={persist}
        class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-5 py-3 text-sm active:scale-95 transition-all min-h-[48px]"
      >
        {saved.value ? '✓ Guardado' : 'Guardar banner nacional'}
      </button>
    </div>
  )
}
