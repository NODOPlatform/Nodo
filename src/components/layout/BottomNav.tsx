import { useLocation } from 'preact-iso'
import { IconHome, IconMapPin, IconPhone, IconBuilding, IconInfo } from '../ui/Icons'
import type { ComponentType } from 'preact'

interface NavItem {
  path: string
  label: string
  Icon: ComponentType<{ size?: number; class?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Inicio', Icon: IconHome },
  { path: '/mapa', label: 'Mapa', Icon: IconMapPin },
  { path: '/emergencias', label: 'Telefonos', Icon: IconPhone },
  { path: '/refugios', label: 'Refugios', Icon: IconBuilding },
  { path: '/info', label: 'Info', Icon: IconInfo },
]

export function BottomNav() {
  const { path } = useLocation()

  return (
    <nav
      class="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/[0.06]"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    >
      <div class="flex justify-around items-center h-[42px] max-w-lg lg:max-w-[1100px] mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const active = path === item.path
          return (
            <a
              key={item.path}
              href={item.path}
              class={`flex flex-col items-center gap-[2px] py-1 px-3 relative transition-all duration-200 ${
                active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <div class="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-white animate-scale-in" />
              )}
              <item.Icon size={18} />
              <span class="text-[9px] font-semibold leading-none">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
