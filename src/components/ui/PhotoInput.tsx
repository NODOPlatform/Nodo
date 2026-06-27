import { useSignal } from '@preact/signals'
import { compressImage } from '../../lib/photo'
import { useRef } from 'preact/hooks'

interface PhotoInputProps {
  onPhoto: (blob: Blob) => void
  label?: string
}

export function PhotoInput({ onPhoto, label = 'Foto opcional' }: PhotoInputProps) {
  const preview = useSignal<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const revokePreview = () => {
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
      preview.value = null
    }
  }

  const handleChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      revokePreview()
      preview.value = URL.createObjectURL(compressed)
      onPhoto(compressed)
    } catch {
      // Silently handle compression errors
    }
  }

  return (
    <div>
      <label class="block text-sm text-nodo-muted mb-1">{label}</label>
      <p class="text-xs text-nodo-muted mb-2">La foto se guarda localmente en tu dispositivo.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        onChange={handleChange}
      />
      {preview.value ? (
        <div class="relative">
          <img src={preview.value} class="w-full h-40 object-cover rounded-lg" alt="Preview" />
          <button
            type="button"
            class="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
            onClick={() => {
              revokePreview()
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            &times;
          </button>
        </div>
      ) : (
        <button
          type="button"
          class="w-full border-2 border-dashed border-nodo-border rounded-lg p-6 text-nodo-muted hover:border-nodo-muted transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          Tomar o seleccionar foto
        </button>
      )}
    </div>
  )
}
