import type { HandlerContext, HandlerResult } from '../types'
import { reply } from '../ai/responseBuilder'
import { ASSIST_CONFIG } from '../config'

export async function handleCreateOffer(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, classified } = ctx

  const helpTypes = classified.entities.filter(e => e.type === 'help_type').map(e => e.value)

  const lines = [
    '🤝 *Gracias por querer ayudar!*\n',
  ]

  if (helpTypes.length > 0) {
    lines.push(`Entendemos que puedes ofrecer: ${helpTypes.join(', ')}\n`)
  }

  lines.push('Para registrar tu oferta de ayuda:')
  lines.push(`${ASSIST_CONFIG.appUrl}/ofrecer-ayuda`)
  lines.push('')
  lines.push('Asi las personas cercanas podran encontrarte cuando necesiten ayuda.')

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
