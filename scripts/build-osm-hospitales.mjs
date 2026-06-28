// Genera el snapshot de hospitales de Venezuela desde OpenStreetMap (Overpass API).
//
// Uso:   node scripts/build-osm-hospitales.mjs
// Salida: src/lib/connect/connectors/data/osm-hospitales-data.ts
//
// Datos © colaboradores de OpenStreetMap, licencia ODbL (https://openstreetmap.org/copyright).
// Se ejecuta a mano para refrescar el dataset; el conector no llama a la red en tiempo de busqueda
// (la query nacional en vivo tarda 10-22s en la instancia publica — inviable al momento de buscar).

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENDPOINT = 'https://overpass-api.de/api/interpreter'
const QUERY = `[out:json][timeout:180];area["ISO3166-1"="VE"][admin_level=2]->.ve;(node["amenity"="hospital"]["name"](area.ve);way["amenity"="hospital"]["name"](area.ve);relation["amenity"="hospital"]["name"](area.ve););out center;`

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/connect/connectors/data/osm-hospitales-data.ts')

function address(tags) {
  if (tags['addr:full']) return tags['addr:full']
  const parts = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
}

function toRecord(el) {
  const tags = el.tags || {}
  if (!tags.name) return null
  return {
    id: `${el.type}/${el.id}`,
    name: tags.name,
    city: tags['addr:city'] || null,
    state: tags['addr:state'] || null,
    address: address(tags),
    phone: tags.phone || tags['contact:phone'] || null,
    lat: typeof el.lat === 'number' ? el.lat : (el.center?.lat ?? null),
    lng: typeof el.lon === 'number' ? el.lon : (el.center?.lon ?? null),
    emergency: tags.emergency === 'yes',
  }
}

function serialize(records) {
  const lines = records.map(r => '  ' + JSON.stringify(r) + ',')
  return `// ARCHIVO AUTO-GENERADO — no editar a mano.
// Regenerar con: node scripts/build-osm-hospitales.mjs
// Fuente: OpenStreetMap via Overpass API. Datos (c) colaboradores de OpenStreetMap, licencia ODbL.
// Query: hospitales (amenity=hospital con nombre) dentro de Venezuela (area ISO3166-1=VE).
// Generado: ${new Date().toISOString()} — Registros: ${records.length}

export interface OsmHospital {
  id: string
  name: string
  city: string | null
  state: string | null
  address: string | null
  phone: string | null
  lat: number | null
  lng: number | null
  emergency: boolean
}

export const OSM_HOSPITALES: OsmHospital[] = [
${lines.join('\n')}
]
`
}

async function main() {
  console.log('Consultando Overpass (Venezuela, amenity=hospital)...')
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'NODO-build-script/1.0 (https://nodoayuda.com; OSM hospital connector)',
    },
    body: 'data=' + encodeURIComponent(QUERY),
  })
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
  const json = await res.json()
  if (json.remark) throw new Error(`Overpass remark: ${json.remark}`)

  const records = (json.elements || [])
    .map(toRecord)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, serialize(records), 'utf8')
  console.log(`OK — ${records.length} hospitales escritos en ${OUT}`)
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
