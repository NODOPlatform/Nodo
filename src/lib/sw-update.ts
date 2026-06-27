import { signal } from '@preact/signals'

export const swNeedsUpdate = signal(false)

let doUpdate: ((reloadPage?: boolean) => Promise<void>) | undefined

export function setSWUpdate(fn: (reloadPage?: boolean) => Promise<void>) {
  doUpdate = fn
}

export function activateUpdate() {
  doUpdate?.(true)
}
