import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from './app'
import { swNeedsUpdate, setSWUpdate } from './lib/sw-update'

const updateSW = registerSW({
  onNeedRefresh() {
    swNeedsUpdate.value = true
  },
})

setSWUpdate(updateSW)

render(<App />, document.getElementById('app')!)
