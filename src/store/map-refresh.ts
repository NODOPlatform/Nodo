import { signal } from '@preact/signals'

export const mapVersion = signal(0)

export function triggerMapRefresh() {
  mapVersion.value++
}
