#!/usr/bin/env node
/**
 * NODO — Importar centros de acopio / refugios desde CSV
 *
 * Uso:
 *   node scripts/import-centers.mjs centros.csv
 *
 * Formato CSV esperado (con encabezados):
 *   nombre,direccion,ciudad,sector,telefono,horario,necesidades,tipo
 *
 * Tipos válidos: collection_center, shelter, hospital, medical_center
 * Si no se indica tipo, se usa "collection_center".
 *
 * El script:
 *  1. Lee el CSV
 *  2. Geocodifica cada dirección con Nominatim (1 req/seg)
 *  3. Verifica duplicados por nombre o proximidad (~100m)
 *  4. Inserta o actualiza en Supabase (points_of_interest)
 *  5. Genera un reporte final
 *
 * Variables de entorno requeridas:
 *   VITE_SUPABASE_URL      (o SUPABASE_URL)
 *   VITE_SUPABASE_ANON_KEY (o SUPABASE_KEY)
 *   EMERGENCY_ID           (UUID de la emergencia activa)
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY
const EMERGENCY_ID = process.env.EMERGENCY_ID

if (!SUPABASE_URL || !SUPABASE_KEY || !EMERGENCY_ID) {
  console.error('Faltan variables de entorno: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, EMERGENCY_ID')
  process.exit(1)
}

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Uso: node scripts/import-centers.mjs <archivo.csv>')
  process.exit(1)
}

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const values = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
      current += ch
    }
    values.push(current.trim())
    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Venezuela')}&format=json&limit=3&countrycodes=ve&accept-language=es`
  const res = await fetch(url, { headers: { 'User-Agent': 'NODO-Venezuela/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  if (data.length === 0) return null
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display_name: data[0].display_name,
  }
}

async function checkExisting(name, lat, lng) {
  const url = `${SUPABASE_URL}/rest/v1/points_of_interest?name=eq.${encodeURIComponent(name)}&select=id&limit=1`
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
  const data = await res.json()
  if (data.length > 0) return data[0]
  const d = 0.001
  const url2 = `${SUPABASE_URL}/rest/v1/points_of_interest?latitude=gte.${lat - d}&latitude=lte.${lat + d}&longitude=gte.${lng - d}&longitude=lte.${lng + d}&select=id,name&limit=1`
  const res2 = await fetch(url2, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
  const data2 = await res2.json()
  return data2.length > 0 ? data2[0] : null
}

async function upsert(row, geo) {
  const poiType = row.tipo || 'collection_center'
  const payload = {
    emergency_id: EMERGENCY_ID,
    poi_type: poiType,
    name: row.nombre,
    latitude: geo.lat,
    longitude: geo.lng,
    address_text: row.direccion,
    city: row.ciudad || null,
    sector: row.sector || null,
    description: row.necesidades || null,
    is_active: true,
    verified: true,
    metadata: {
      status: 'available',
      source: 'csv_import',
      phone: row.telefono || null,
      schedule: row.horario || null,
      geocode_result: geo.display_name,
    },
  }

  const existing = await checkExisting(row.nombre, geo.lat, geo.lng)
  if (existing) {
    await fetch(`${SUPABASE_URL}/rest/v1/points_of_interest?id=eq.${existing.id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
    })
    return { action: 'updated', id: existing.id }
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/points_of_interest`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  return { action: 'inserted', id: data?.[0]?.id || 'unknown' }
}

async function main() {
  const csv = readFileSync(resolve(csvPath), 'utf-8')
  const rows = parseCSV(csv)
  console.log(`\n📋 ${rows.length} registros encontrados en ${csvPath}\n`)

  const results = []
  for (const row of rows) {
    if (!row.nombre) { console.log('⚠️  Fila sin nombre, saltando'); continue }
    const query = [row.nombre, row.direccion, row.ciudad].filter(Boolean).join(', ')
    console.log(`📍 ${row.nombre}...`)
    const geo = await geocode(query)
    if (!geo) {
      console.log(`   ❌ No geocodificado`)
      results.push({ name: row.nombre, status: 'FAILED' })
    } else {
      const r = await upsert(row, geo)
      console.log(`   ✅ ${r.action} (${geo.lat}, ${geo.lng})`)
      results.push({ name: row.nombre, ...r, lat: geo.lat, lng: geo.lng })
    }
    await new Promise(r => setTimeout(r, 1100))
  }

  console.log(`\n=== RESUMEN ===`)
  const ok = results.filter(r => r.status !== 'FAILED')
  const fail = results.filter(r => r.status === 'FAILED')
  console.log(`✅ Exitosos: ${ok.length}`)
  console.log(`❌ Fallidos: ${fail.length}`)
  fail.forEach(r => console.log(`   - ${r.name}`))
}

main().catch(console.error)
