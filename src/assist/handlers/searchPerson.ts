import type { HandlerContext, HandlerResult } from '../types'
import { searchPersons } from '../services/search'
import { reply, noResults, mapLink, formatDistance } from '../ai/responseBuilder'
import { ASSIST_CONFIG } from '../config'

export async function handleSearchPerson(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, classified } = ctx
  const nameEntity = classified.entities.find(e => e.type === 'person_name')
  const query = nameEntity?.value || classified.rawText.replace(/busco a|se busca|donde esta/gi, '').trim()

  if (!query || query.length < 2) {
    return {
      messages: [reply(message.channel, message.senderId, 'Por favor, indica el nombre de la persona que buscas.\n\nEjemplo: "Busco a Maria Gonzalez"')],
    }
  }

  const results = await searchPersons(query)

  if (results.length === 0) {
    return {
      messages: [
        noResults(message.channel, message.senderId, `resultados para "${query}"`),
        reply(message.channel, message.senderId, `Puedes registrar a esta persona como desaparecida en:\n${ASSIST_CONFIG.appUrl}/buscar-persona`),
      ],
    }
  }

  const lines = [`🔍 Resultados para "${query}":\n`]
  for (const r of results) {
    lines.push(`${r.icon} *${r.title}*`)
    lines.push(`   ${r.subtitle}`)
    if (r.lat && r.lng) {
      if (r.distance) lines.push(`   📍 ${formatDistance(r.distance)}`)
      lines.push(`   🗺️ ${mapLink(r.lat, r.lng)}`)
    }
    lines.push('')
  }

  return {
    messages: [reply(message.channel, message.senderId, lines.join('\n'))],
  }
}
