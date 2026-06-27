import type { HandlerContext, HandlerResult } from '../types'
import { searchCampaigns } from '../services/search'
import { reply, noResults, mapLink } from '../ai/responseBuilder'

export async function handleSearchCampaign(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx

  const results = await searchCampaigns()

  if (results.length === 0) {
    return { messages: [noResults(message.channel, message.senderId, 'campanas activas')] }
  }

  const lines = ['📢 *Campanas activas:*\n']
  for (const r of results) {
    lines.push(`${r.icon} *${r.title}*`)
    if (r.subtitle) lines.push(`   ${r.subtitle}`)
    if (r.extra) {
      if (r.extra.start) lines.push(`   📅 Desde: ${r.extra.start}`)
      if (r.extra.end) lines.push(`   📅 Hasta: ${r.extra.end}`)
    }
    if (r.lat && r.lng) lines.push(`   🗺️ ${mapLink(r.lat, r.lng)}`)
    lines.push('')
  }

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
