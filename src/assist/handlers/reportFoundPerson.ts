import type { HandlerContext, HandlerResult } from '../types'
import { reply } from '../ai/responseBuilder'
import { ASSIST_CONFIG } from '../config'

export async function handleReportFoundPerson(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, classified } = ctx

  const nameEntity = classified.entities.find(e => e.type === 'person_name')

  const lines = [
    '✅ *Reporte de persona encontrada*\n',
  ]

  if (nameEntity) {
    lines.push(`Nombre mencionado: *${nameEntity.value}*`)
    lines.push('')
  }

  lines.push('Para registrar la informacion completa:')
  lines.push(`${ASSIST_CONFIG.appUrl}/reportar-encontrado`)
  lines.push('')
  lines.push('Es importante incluir:')
  lines.push('• Nombre completo')
  lines.push('• Donde fue encontrada')
  lines.push('• Estado de salud')
  lines.push('• Contacto de referencia')

  return { messages: [reply(message.channel, message.senderId, lines.join('\n'))] }
}
