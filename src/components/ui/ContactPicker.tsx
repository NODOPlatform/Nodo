import { useSignal } from '@preact/signals'

export type ContactMethod = 'whatsapp' | 'call' | 'telegram' | 'sms' | 'instagram' | 'email' | 'other'

const METHODS: { value: ContactMethod; label: string; icon: string; placeholder: string; inputType: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬', placeholder: '+58 412 1234567', inputType: 'tel' },
  { value: 'call', label: 'Llamada', icon: '📞', placeholder: '+58 212 1234567', inputType: 'tel' },
  { value: 'telegram', label: 'Telegram', icon: '✈️', placeholder: '@usuario o +58...', inputType: 'text' },
  { value: 'sms', label: 'SMS', icon: '💬', placeholder: '+58 412 1234567', inputType: 'tel' },
  { value: 'instagram', label: 'Instagram', icon: '📷', placeholder: '@usuario', inputType: 'text' },
  { value: 'email', label: 'Correo', icon: '📧', placeholder: 'correo@ejemplo.com', inputType: 'email' },
  { value: 'other', label: 'Otro', icon: '💬', placeholder: 'Indica como contactarte', inputType: 'text' },
]

interface ContactPickerProps {
  onContactChange: (contact: { method: ContactMethod; value: string } | null) => void
}

export function ContactPicker({ onContactChange }: ContactPickerProps) {
  const method = useSignal<ContactMethod | ''>('')
  const contactValue = useSignal('')

  const handleMethodChange = (m: ContactMethod) => {
    method.value = m
    contactValue.value = ''
    onContactChange(null)
  }

  const handleValueChange = (e: Event) => {
    const v = (e.target as HTMLInputElement).value
    contactValue.value = v
    if (method.value && v.trim()) {
      onContactChange({ method: method.value, value: v.trim() })
    } else {
      onContactChange(null)
    }
  }

  const selected = METHODS.find(m => m.value === method.value)

  return (
    <div class="space-y-2">
      <label class="block text-sm text-nodo-muted">Como prefieres que te contacten?</label>
      <div class="flex flex-wrap gap-1.5">
        {METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            class={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              method.value === m.value
                ? 'bg-blue-700 border-blue-500 text-white'
                : 'bg-nodo-card border-nodo-border text-nodo-muted hover:text-white'
            }`}
            onClick={() => handleMethodChange(m.value)}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {selected && (
        <input
          type={selected.inputType}
          class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
          placeholder={selected.placeholder}
          value={contactValue.value}
          onInput={handleValueChange}
        />
      )}
    </div>
  )
}
