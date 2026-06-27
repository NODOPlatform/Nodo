import type { ComponentChildren } from 'preact'
import { useEffect } from 'preact/hooks'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ComponentChildren
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div class="fixed inset-0 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-label={title}>
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div class="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div class="bg-nodo-card border-t border-nodo-border rounded-t-[20px] max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/50">
          <div class="sticky top-0 bg-nodo-card z-10 pt-3 pb-2 px-5">
            <div class="w-10 h-1 rounded-full bg-nodo-border mx-auto mb-3" />
            {title && (
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold">{title}</h3>
                <button
                  onClick={onClose}
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-nodo-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label="Cerrar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>
          <div class="px-5 pb-8" style="padding-bottom: max(32px, env(safe-area-inset-bottom))">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
