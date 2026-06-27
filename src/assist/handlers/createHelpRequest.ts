import type { HandlerContext, HandlerResult } from '../types'
import { reply } from '../ai/responseBuilder'
import { findMatches } from '../services/matching'
import { formatDistance, mapLink } from '../ai/responseBuilder'
import { ASSIST_CONFIG } from '../config'

export async function handleCreateHelpRequest(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, classified } = ctx

  const helpTypes = classified.entities.filter(e => e.type === 'help_type').map(e => e.value)
  const urgency = classified.entities.find(e => e.type === 'urgency')
  const location = message.location

  const lines: string[] = []

  if (urgency?.value === 'critical') {
    lines.push('🚨 *Entendemos que es urgente.*')
    lines.push('Si hay peligro inmediato, llama al *911*.\n')
  }

  lines.push('📋 *Tu solicitud ha sido recibida.*\n')

  if (helpTypes.length > 0) {
    lines.push(`Tipo: ${helpTypes.join(', ')}`)
  }
  if (urgency) {
    lines.push(`Urgencia: ${urgency.value === 'critical' ? 'Critica' : 'Alta'}`)
  }

  lines.push('')
  lines.push(`Para registrarla oficialmente con todos los detalles:`)
  lines.push(`${ASSIST_CONFIG.appUrl}/pedir-ayuda`)

  if (location && helpTypes.length > 0) {
    const matches = await findMatches(helpTypes, location.lat, location.lng)
    if (matches.length > 0) {
      lines.push('\n🤝 *Recursos cercanos que pueden ayudarte:*\n')
      for (const m of matches) {
        const icon = m.type === 'offer' ? '🤝' : m.type === 'shelter' ? '🏠' : '📦'
        lines.push(`${icon} *${m.title}* — ${formatDistance(m.distance)}`)
        if (m.details) lines.push(`   ${m.details}`)
        lines.push(`   🗺️ ${mapLink(m.lat, m.lng)}`)
        lines.push('')
      }
    }
  } else if (!location) {
    lines.push('\n💡 Envia tu ubicacion para encontrar ayuda cercana.')
  }

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
