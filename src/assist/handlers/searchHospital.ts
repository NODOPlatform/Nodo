import type { HandlerContext, HandlerResult } from '../types'
import { searchHospitals } from '../services/search'
import { reply, noResults, mapLink, formatDistance } from '../ai/responseBuilder'

export async function handleSearchHospital(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx

  const results = await searchHospitals(message.location?.lat, message.location?.lng)

  if (results.length === 0) {
    return { messages: [noResults(message.channel, message.senderId, 'hospitales registrados')] }
  }

  const lines = ['🏥 *Hospitales cercanos:*\n']
  for (const r of results) {
    lines.push(`${r.icon} *${r.title}*`)
    if (r.subtitle) lines.push(`   ${r.subtitle}`)
    if (r.distance) lines.push(`   📍 ${formatDistance(r.distance)}`)
    if (r.lat && r.lng) lines.push(`   🗺️ ${mapLink(r.lat, r.lng)}`)
    lines.push('')
  }

  if (!message.location) {
    lines.push('💡 Envia tu ubicacion para resultados mas precisos.')
  }

  lines.push('⚠️ Si es una emergencia medica, llama al 911.')

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
