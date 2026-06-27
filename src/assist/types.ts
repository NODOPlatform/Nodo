export type Intent =
  | 'search_person'
  | 'search_shelter'
  | 'search_hospital'
  | 'search_collection_center'
  | 'search_campaign'
  | 'search_health_request'
  | 'search_verified_info'
  | 'create_help_request'
  | 'create_offer'
  | 'report_incident'
  | 'report_found_person'
  | 'greeting'
  | 'help'
  | 'unknown'

export interface Entity {
  type: 'person_name' | 'location' | 'help_type' | 'blood_type' | 'urgency' | 'phone' | 'age' | 'description'
  value: string
  confidence: number
}

export interface ClassifiedMessage {
  intent: Intent
  confidence: number
  entities: Entity[]
  rawText: string
}

export type ChannelType = 'whatsapp' | 'telegram' | 'sms' | 'web'

export interface IncomingMessage {
  channel: ChannelType
  senderId: string
  senderName?: string
  text: string
  timestamp: number
  location?: { lat: number; lng: number }
  mediaUrl?: string
  mediaType?: 'image' | 'audio' | 'document'
  replyTo?: string
}

export interface OutgoingMessage {
  channel: ChannelType
  recipientId: string
  text: string
  mapUrl?: string
  buttons?: Array<{ label: string; payload: string }>
}

export interface HandlerResult {
  messages: OutgoingMessage[]
  followUp?: Intent
}

export interface HandlerContext {
  message: IncomingMessage
  classified: ClassifiedMessage
}
