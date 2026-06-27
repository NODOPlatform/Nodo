import type { HandlerContext, HandlerResult } from '../types'
import { reply } from '../ai/responseBuilder'
import { ASSIST_CONFIG } from '../config'

export async function handleReportIncident(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, classified } = ctx

  const location = message.location
  const locationEntity = classified.entities.find(e => e.type === 'location')

  const lines = [
    '🚨 *Reporte de incidente recibido.*\n',
    `"${classified.rawText.slice(0, 100)}"`,
    '',
  ]

  if (location) {
    lines.push(`📍 Ubicacion recibida: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`)
  } else if (locationEntity) {
    lines.push(`📍 Ubicacion mencionada: ${locationEntity.value}`)
  }

  lines.push('')
  lines.push('Para registrar el incidente con mas detalles (fotos, ubicacion exacta):')
  lines.push(`${ASSIST_CONFIG.appUrl}/pedir-ayuda`)
  lines.push('')
  lines.push('⚠️ Si hay personas en peligro inmediato, llama al *911*.')

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
