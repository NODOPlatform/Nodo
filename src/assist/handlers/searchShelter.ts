import type { HandlerContext, HandlerResult } from '../types'
import { searchShelters } from '../services/search'
import { reply, noResults, mapLink, formatDistance } from '../ai/responseBuilder'

export async function handleSearchShelter(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx
  const userLat = message.location?.lat
  const userLng = message.location?.lng

  const results = await searchShelters(userLat, userLng)

  if (results.length === 0) {
    return { messages: [noResults(message.channel, message.senderId, 'refugios activos')] }
  }

  const lines = ['🏠 *Refugios disponibles:*\n']
  for (const r of results) {
    lines.push(`${r.icon} *${r.title}*`)
    lines.push(`   ${r.subtitle}`)
    if (r.extra) {
      const cap = r.extra.capacity as number
      const occ = r.extra.occupancy as number
      if (cap) lines.push(`   Capacidad: ${occ || 0}/${cap}`)
      if (r.extra.phone) lines.push(`   📞 ${r.extra.phone}`)
    }
    if (r.distance) lines.push(`   📍 ${formatDistance(r.distance)}`)
    if (r.lat && r.lng) lines.push(`   🗺️ ${mapLink(r.lat, r.lng)}`)
    lines.push('')
  }

  if (!userLat) {
    lines.push('💡 Envia tu ubicacion para ver refugios mas cercanos.')
  }

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
