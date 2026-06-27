import type { OutgoingMessage, ChannelType } from '../types'
import { ASSIST_CONFIG } from '../config'

export function reply(channel: ChannelType, recipientId: string, text: string, mapUrl?: string): OutgoingMessage {
  return { channel, recipientId, text, mapUrl }
}

export function greeting(channel: ChannelType, recipientId: string): OutgoingMessage {
  return reply(channel, recipientId, [
    `Hola! Soy *NODO Assist* 🤝`,
    '',
    'Puedes escribirme como le hablarias a una persona:',
    '',
    '🔍 "Busco a Maria Gonzalez"',
    '🏠 "Necesito un refugio"',
    '🩸 "Quiero donar sangre"',
    '🆘 "Necesito agua urgente"',
    '🤝 "Quiero ayudar"',
    '🚨 "Hay un derrumbe en Catia"',
    '📢 "Que campanas hay activas?"',
    '',
    'Escribe lo que necesitas y te ayudo.',
  ].join('\n'))
}

export function helpMenu(channel: ChannelType, recipientId: string): OutgoingMessage {
  return reply(channel, recipientId, [
    '*NODO Assist* — Centro de Coordinacion Ciudadana',
    '',
    'Puedo ayudarte con:',
    '',
    '👥 Buscar personas desaparecidas',
    '🏠 Encontrar refugios cercanos',
    '🏥 Buscar hospitales',
    '🩸 Solicitudes de sangre',
    '📦 Centros de acopio',
    '📢 Campanas activas',
    '📰 Informacion verificada',
    '🆘 Crear solicitud de ayuda',
    '🤝 Ofrecer ayuda',
    '🚨 Reportar incidente',
    '',
    `Mas informacion: ${ASSIST_CONFIG.appUrl}`,
  ].join('\n'))
}

export function noResults(channel: ChannelType, recipientId: string, what: string): OutgoingMessage {
  return reply(channel, recipientId, `No encontramos ${what} en este momento.\n\nPuedes buscar directamente en:\n${ASSIST_CONFIG.appUrl}`)
}

export function notUnderstood(channel: ChannelType, recipientId: string): OutgoingMessage {
  return reply(channel, recipientId, [
    'No pude entender tu mensaje.',
    '',
    'Intenta escribir de forma sencilla:',
    '• "Busco a [nombre]"',
    '• "Necesito [agua/refugio/medicina]"',
    '• "Quiero ayudar"',
    '',
    'Escribe *menu* para ver todas las opciones.',
  ].join('\n'))
}

export function mapLink(lat: number, lng: number): string {
  return `${ASSIST_CONFIG.mapBaseUrl}?lat=${lat}&lng=${lng}&zoom=16`
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
