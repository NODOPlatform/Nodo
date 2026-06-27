import type { HandlerContext, HandlerResult } from '../types'
import { searchHealthRequests } from '../services/search'
import { reply, noResults, mapLink, formatDistance } from '../ai/responseBuilder'

export async function handleSearchHealthRequest(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, classified } = ctx
  const bloodEntity = classified.entities.find(e => e.type === 'blood_type')

  const results = await searchHealthRequests(bloodEntity?.value, message.location?.lat, message.location?.lng)

  if (results.length === 0) {
    const detail = bloodEntity ? `solicitudes de sangre tipo ${bloodEntity.value}` : 'solicitudes de sangre activas'
    return { messages: [noResults(message.channel, message.senderId, detail)] }
  }

  const lines = ['🩸 *Solicitudes de sangre:*\n']
  for (const r of results) {
    lines.push(`${r.icon} *${r.title}*`)
    lines.push(`   ${r.subtitle}`)
    if (r.distance) lines.push(`   📍 ${formatDistance(r.distance)}`)
    if (r.lat && r.lng) lines.push(`   🗺️ ${mapLink(r.lat, r.lng)}`)
    lines.push('')
  }

  if (!message.location) {
    lines.push('💡 Envia tu ubicacion para ver solicitudes cercanas.')
  }

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
