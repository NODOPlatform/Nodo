import { isOnline } from '../../hooks/useOnlineStatus'
import { pendingCount } from '../../hooks/useOfflineQueue'

export function OfflineBanner() {
  if (isOnline.value && pendingCount.value === 0) return null

  return (
    <div class="bg-amber-900/70 border-b border-amber-700/40 px-4 py-2.5 text-center animate-fade-in">
      {!isOnline.value && (
        <span class="text-amber-200 text-sm font-medium">
          Sin conexion
          {pendingCount.value > 0 && ` — ${pendingCount.value} envio${pendingCount.value > 1 ? 's' : ''} pendiente${pendingCount.value > 1 ? 's' : ''}`}
        </span>
      )}
      {isOnline.value && pendingCount.value > 0 && (
        <span class="text-amber-200 text-sm font-medium flex items-center justify-center gap-2">
          <span class="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin inline-block" />
          Sincronizando {pendingCount.value} envio{pendingCount.value > 1 ? 's' : ''} pendiente{pendingCount.value > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
