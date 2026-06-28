import { initHospitalesConnector } from './hospitales-connector'
import { initVenezuelaTeBuscaConnector } from './venezuela-te-busca-connector'
import { initDesaparecidosTerremotoConnector } from './desaparecidos-terremoto-connector'
import { initVzlaAyudaConnector } from './vzlaayuda-connector'
import { initPatitasConnector } from './patitas-connector'
import { initReencuentroConnector } from './reencuentro-connector'
import { initOsmHospitalesConnector } from './osm-hospitales-connector'

let initialized = false

export function initConnectors(): void {
  if (initialized) return
  initialized = true
  initHospitalesConnector()
  initVenezuelaTeBuscaConnector()
  initDesaparecidosTerremotoConnector()
  initVzlaAyudaConnector()
  initPatitasConnector()
  initReencuentroConnector()
  initOsmHospitalesConnector()
}
