import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'

const DISMISSED_KEY = 'nodo_install_dismissed'
const DISMISS_COOLDOWN = 24 * 60 * 60 * 1000

function isDismissed(): boolean {
  const val = localStorage.getItem(DISMISSED_KEY)
  if (!val) return false
  if (val === 'installed') return true
  const ts = parseInt(val)
  if (isNaN(ts)) return false
  return Date.now() - ts < DISMISS_COOLDOWN
}

export function InstallBanner() {
  const deferredPrompt = useSignal<{ prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null)
  const visible = useSignal(false)
  const isIOS = useSignal(false)

  useEffect(() => {
    if (isDismissed()) return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as unknown as Record<string, unknown>).standalone) return

    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream
    isIOS.value = ios

    if (ios) {
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
      if (isSafari) visible.value = true
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e as unknown as typeof deferredPrompt.value
      visible.value = true
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      visible.value = false
      localStorage.setItem(DISMISSED_KEY, 'installed')
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    const prompt = deferredPrompt.value
    if (!prompt) return
    try {
      await prompt.prompt()
      const result = await prompt.userChoice
      if (result.outcome === 'accepted') {
        localStorage.setItem(DISMISSED_KEY, 'installed')
      }
    } catch { /* prompt failed */ }
    deferredPrompt.value = null
    visible.value = false
  }

  const dismiss = () => {
    visible.value = false
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
  }

  if (!visible.value) return null

  return (
    <div class="bg-brand-navy border-b border-white/[0.06] px-4 py-3 animate-slide-up">
      <div class="max-w-lg mx-auto flex items-start gap-3">
        <span class="text-2xl flex-shrink-0 mt-0.5">📲</span>
        <div class="flex-1 min-w-0">
          <p class="text-white font-bold text-sm">Instala NODO</p>
          <p class="text-blue-200/80 text-xs leading-relaxed mt-0.5">
            Accede mas rapido incluso sin conexion.
          </p>

          {isIOS.value ? (
            <div class="mt-2.5 bg-white/[0.08] rounded-xl p-3">
              <p class="text-blue-100 text-xs font-semibold mb-2">Como instalar:</p>
              <div class="space-y-1.5">
                <p class="text-blue-100 text-xs flex items-start gap-2">
                  <span class="font-bold flex-shrink-0">1.</span>
                  <span>Toca <strong>Compartir</strong> 📤 en la barra</span>
                </p>
                <p class="text-blue-100 text-xs flex items-start gap-2">
                  <span class="font-bold flex-shrink-0">2.</span>
                  <span><strong>Anadir a pantalla de inicio</strong> ➕</span>
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              class="mt-2.5 bg-white text-brand-navy font-bold text-sm px-5 py-2 rounded-xl hover:bg-blue-50 transition-colors active:scale-[0.97]"
              onClick={handleInstall}
            >
              Instalar
            </button>
          )}
        </div>
        <button type="button" class="text-blue-300/60 hover:text-white text-lg p-1 transition-colors" onClick={dismiss} aria-label="Cerrar">✕</button>
      </div>
    </div>
  )
}
