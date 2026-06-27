import type { ComponentChildren } from 'preact'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ComponentChildren
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        class="relative bg-nodo-card border border-nodo-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 animate-slide-up shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold">{title}</h3>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-nodo-muted hover:text-white hover:bg-white/[0.06] transition-colors" aria-label="Cerrar" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
