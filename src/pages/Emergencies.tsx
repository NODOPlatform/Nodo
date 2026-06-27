import { useLocation } from 'preact-iso'
import { getEmergencyContacts } from '../lib/emergency-contacts'
import { IconArrowLeft, IconPhone } from '../components/ui/Icons'

export function Emergencies() {
  const { route } = useLocation()
  const contacts = getEmergencyContacts()

  return (
    <div class="p-4 pb-20 animate-fade-in max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-5">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => route('/')}>
          <IconArrowLeft size={18} />
        </button>
        <h2 class="text-lg font-bold">Telefonos de emergencia</h2>
      </div>

      <p class="text-nodo-muted text-sm mb-5 leading-relaxed">
        Toca un contacto para llamar directamente.
      </p>

      <div class="space-y-2.5 stagger">
        {contacts.map((contact) => (
          <div
            key={contact.name}
            class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden"
          >
            {contact.phone ? (
              <a
                href={`tel:${contact.phone.replace(/[^+0-9*#]/g, '')}`}
                class="flex items-center gap-3.5 p-4 text-white no-underline hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
              >
                <span class="text-2xl flex-shrink-0" aria-hidden="true">{contact.icon}</span>
                <div class="flex-1 min-w-0">
                  <span class="font-semibold text-[15px] block">{contact.name}</span>
                  <span class="text-nodo-muted text-xs block mt-0.5">{contact.description}</span>
                </div>
                <div class="flex-shrink-0 flex items-center gap-2">
                  <span class="text-brand-gold font-mono text-sm">{contact.phone}</span>
                  <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center">
                    <IconPhone size={16} class="text-white" />
                  </div>
                </div>
              </a>
            ) : (
              <div class="flex items-center gap-3.5 p-4 opacity-60">
                <span class="text-2xl flex-shrink-0" aria-hidden="true">{contact.icon}</span>
                <div class="flex-1 min-w-0">
                  <span class="font-semibold text-[15px] block">{contact.name}</span>
                  <span class="text-nodo-muted text-xs block mt-0.5">{contact.description}</span>
                </div>
                <span class="text-xs text-nodo-muted italic flex-shrink-0">Proximamente</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
