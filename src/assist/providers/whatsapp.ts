import type { IncomingMessage, OutgoingMessage } from '../types'

export interface WhatsAppConfig {
  verifyToken: string
  accessToken: string
  phoneNumberId: string
}

export interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: { display_phone_number: string; phone_number_id: string }
        contacts?: Array<{ profile: { name: string }; wa_id: string }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: 'text' | 'location' | 'image' | 'audio' | 'document'
          text?: { body: string }
          location?: { latitude: number; longitude: number; name?: string }
          image?: { id: string; mime_type: string }
          audio?: { id: string; mime_type: string }
          document?: { id: string; mime_type: string; filename: string }
        }>
      }
      field: string
    }>
  }>
}

export function parseWebhook(payload: WhatsAppWebhookPayload): IncomingMessage | null {
  const entry = payload.entry?.[0]
  const change = entry?.changes?.[0]
  const value = change?.value
  const msg = value?.messages?.[0]
  const contact = value?.contacts?.[0]

  if (!msg) return null

  const base: IncomingMessage = {
    channel: 'whatsapp',
    senderId: msg.from,
    senderName: contact?.profile?.name,
    text: '',
    timestamp: parseInt(msg.timestamp) * 1000,
  }

  switch (msg.type) {
    case 'text':
      base.text = msg.text?.body || ''
      break
    case 'location':
      base.text = msg.location?.name || 'ubicacion compartida'
      base.location = msg.location ? { lat: msg.location.latitude, lng: msg.location.longitude } : undefined
      break
    case 'image':
      base.mediaUrl = msg.image?.id
      base.mediaType = 'image'
      base.text = '[imagen]'
      break
    case 'audio':
      base.mediaUrl = msg.audio?.id
      base.mediaType = 'audio'
      base.text = '[audio]'
      break
    case 'document':
      base.mediaUrl = msg.document?.id
      base.mediaType = 'document'
      base.text = '[documento]'
      break
  }

  return base
}

export function verifyWebhook(query: { 'hub.mode'?: string; 'hub.verify_token'?: string; 'hub.challenge'?: string }, verifyToken: string): string | null {
  if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === verifyToken) {
    return query['hub.challenge'] || null
  }
  return null
}

export function buildSendPayload(msg: OutgoingMessage): Record<string, unknown> {
  return {
    messaging_product: 'whatsapp',
    to: msg.recipientId,
    type: 'text',
    text: { body: msg.text },
  }
}

export async function sendMessage(msg: OutgoingMessage, config: WhatsAppConfig): Promise<boolean> {
  const payload = buildSendPayload(msg)

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  return res.ok
}
