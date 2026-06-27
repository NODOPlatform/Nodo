import { signal } from '@preact/signals'
import { getCurrentPosition, type GeoPosition } from '../lib/geolocation'

const position = signal<GeoPosition | null>(null)
const loading = signal(false)
const error = signal<string | null>(null)

export function useGeolocation() {
  const requestPosition = async () => {
    loading.value = true
    error.value = null
    try {
      position.value = await getCurrentPosition()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error de ubicacion'
    } finally {
      loading.value = false
    }
  }

  return { position, loading, error, requestPosition }
}
