import type { HandlerContext, HandlerResult } from '../types'
import { searchVerifiedInfo } from '../services/search'
import { reply, noResults } from '../ai/responseBuilder'
import { ASSIST_CONFIG } from '../config'

export async function handleSearchVerifiedInfo(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx

  const results = await searchVerifiedInfo()

  if (results.length === 0) {
    return { messages: [noResults(message.channel, message.senderId, 'informacion verificada reciente')] }
  }

  const lines = ['📰 *Informacion verificada:*\n']
  for (const r of results) {
    lines.push(`${r.icon} *${r.title}*`)
    if (r.subtitle) lines.push(`   ${r.subtitle}`)
    if (r.extra?.content) {
      const content = (r.extra.content as string).slice(0, 120)
      lines.push(`   ${content}${(r.extra.content as string).length > 120 ? '...' : ''}`)
    }
    lines.push('')
  }

  lines.push(`Ver todo: ${ASSIST_CONFIG.appUrl}/info-verificada`)

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
