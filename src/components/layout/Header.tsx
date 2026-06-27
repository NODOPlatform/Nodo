import { useLocation } from 'preact-iso'
import { useRef } from 'preact/hooks'
import { isOnline } from '../../hooks/useOnlineStatus'
import { adminAuthenticated, adminRole, adminUserName, logoutAdmin } from '../../store/admin-session'

export function Header() {
  const { route } = useLocation()
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogoClick = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()

    tapCount.current++

    if (tapTimer.current) clearTimeout(tapTimer.current)

    if (tapCount.current >= 7) {
      tapCount.current = 0
      route('/admin')
      return
    }

    tapTimer.current = setTimeout(() => {
      if (tapCount.current < 7) route('/')
      tapCount.current = 0
    }, 3000)
  }

  return (
    <header class="sticky top-0 z-40 glass border-b border-white/[0.06]" style="padding-top: env(safe-area-inset-top, 0px)">
      <div class="flex items-center justify-between px-4 py-1.5 max-w-lg lg:max-w-[1100px] mx-auto">
        <button type="button" onClick={handleLogoClick} class="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer" aria-label="Inicio">
          <img src="/logo.png" alt="" class="h-8 w-8 object-contain rounded-lg pointer-events-none" width="32" height="32" />
          <div class="flex flex-col">
            <span class="text-white font-extrabold text-[15px] tracking-wide leading-none">NODO</span>
            <span class="text-[8px] text-nodo-muted font-semibold uppercase tracking-widest leading-none mt-0.5">Centro de coordinacion</span>
          </div>
        </button>

        <div class="flex items-center gap-2">
          {adminAuthenticated.value ? (
            <>
              <button
                onClick={() => route('/admin')}
                class="text-[10px] font-semibold bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg px-2 py-1 active:scale-95 transition-transform"
              >
                Panel
              </button>
              <div class="flex items-center gap-1.5">
                <div class={`w-1.5 h-1.5 rounded-full ${adminRole.value === 'owner' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span class={`text-[10px] font-semibold ${adminRole.value === 'owner' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {adminRole.value === 'owner' ? 'Owner' : adminUserName.value}
                </span>
              </div>
              <button
                onClick={() => { logoutAdmin(); route('/') }}
                class="text-[10px] text-nodo-muted bg-nodo-card border border-nodo-border rounded-lg px-2 py-1 active:scale-95 transition-transform"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <div
                class={`w-1.5 h-1.5 rounded-full ${isOnline.value ? 'bg-emerald-400' : 'bg-red-500'}`}
                style={isOnline.value ? { animation: 'pulse-dot 2s ease-in-out infinite' } : undefined}
              />
              <span class={`text-[11px] font-medium ${isOnline.value ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline.value ? 'En linea' : 'Sin conexion'}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
