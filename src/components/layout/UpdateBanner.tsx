import { swNeedsUpdate, activateUpdate } from '../../lib/sw-update'

export function UpdateBanner() {
  if (!swNeedsUpdate.value) return null

  return (
    <div class="fixed bottom-16 left-4 right-4 z-[9999] max-w-lg mx-auto">
      <div class="bg-brand-navy border border-blue-600/50 rounded-xl p-4 shadow-2xl shadow-black/40 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-semibold">Hay una nueva version de NODO disponible.</p>
        </div>
        <button
          class="bg-white text-brand-navy font-bold text-sm px-4 py-2 rounded-lg flex-shrink-0 hover:bg-blue-50 transition-colors active:scale-[0.97]"
          onClick={activateUpdate}
        >
          Actualizar
        </button>
      </div>
    </div>
  )
}
