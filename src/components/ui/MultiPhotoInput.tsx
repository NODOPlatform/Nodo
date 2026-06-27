import { useRef } from 'preact/hooks'
import { compressImage } from '../../lib/photo'

interface MultiPhotoInputProps {
  images: string[]
  onAdd: (dataUrl: string) => void
  onRemove: (idx: number) => void
  label?: string
  showCoverBadge?: boolean
}

export function MultiPhotoInput({ images, onAdd, onRemove, label = 'Fotos', showCoverBadge = true }: MultiPhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      const reader = new FileReader()
      reader.onload = () => { onAdd(reader.result as string) }
      reader.readAsDataURL(compressed)
    } catch {
      // compression failed silently
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label class="block text-sm text-nodo-muted mb-1">{label}</label>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" class="hidden" onChange={handleChange} />
      <button
        type="button"
        class="w-full border-2 border-dashed border-nodo-border rounded-lg p-4 text-nodo-muted hover:border-nodo-muted transition-colors text-sm"
        onClick={() => inputRef.current?.click()}
      >
        Tomar o seleccionar foto
      </button>
      {images.length > 0 && (
        <div class="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <div key={idx} class="relative flex-shrink-0">
              <img src={img} class="w-20 h-20 object-cover rounded-lg" alt={`Foto ${idx + 1}`} />
              {showCoverBadge && idx === 0 && (
                <span class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 rounded-b-lg">Portada</span>
              )}
              <button
                type="button"
                class="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                onClick={() => onRemove(idx)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CoverImage({ images, name, height = 'h-40' }: { images?: string[] | null; name?: string; height?: string }) {
  const list = images || []
  if (!list[0]) return null
  return <img src={list[0]} class={`w-full ${height} object-cover`} alt={name || ''} />
}

export function PhotoGallery({ images }: { images?: string[] | null }) {
  const list = images || []
  if (list.length <= 1) return null
  return (
    <div class="flex gap-2 overflow-x-auto pb-2 mb-3">
      {list.map((img, idx) => (
        <img key={idx} src={img} class="w-20 h-20 object-cover rounded-lg flex-shrink-0" alt={`Foto ${idx + 1}`} />
      ))}
    </div>
  )
}
