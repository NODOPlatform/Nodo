import type { Intent, ClassifiedMessage } from '../types'
import { extractEntities } from './entityExtractor'

interface IntentRule {
  intent: Intent
  keywords: string[]
  weight: number
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'search_person',
    keywords: ['busco a', 'buscar persona', 'buscar a', 'persona desaparecida', 'desaparecido', 'desaparecida', 'se busca', 'no encuentro a', 'no aparece', 'donde esta', 'mi mama', 'mi papa', 'mi hijo', 'mi hija', 'mi hermano', 'mi hermana', 'mi esposo', 'mi esposa', 'familiar', 'missing'],
    weight: 5,
  },
  {
    intent: 'report_found_person',
    keywords: ['encontre', 'encontramos', 'aparecio', 'fue encontrado', 'fue encontrada', 'esta en el hospital', 'esta a salvo', 'localizado', 'localizada', 'ya aparecio'],
    weight: 5,
  },
  {
    intent: 'search_shelter',
    keywords: ['refugio', 'albergue', 'donde dormir', 'necesito refugio', 'busco refugio', 'alojamiento', 'donde ir', 'no tengo donde', 'quedarme', 'shelter'],
    weight: 4,
  },
  {
    intent: 'search_hospital',
    keywords: ['hospital', 'clinica', 'emergencia medica', 'centro medico', 'medico', 'doctor', 'urgencia medica', 'ambulancia', 'herido', 'herida'],
    weight: 4,
  },
  {
    intent: 'search_health_request',
    keywords: ['sangre', 'donante', 'donar sangre', 'banco de sangre', 'plaquetas', 'donacion de sangre', 'tipo de sangre', 'o+', 'o-', 'a+', 'a-', 'b+', 'b-', 'ab+', 'ab-'],
    weight: 4,
  },
  {
    intent: 'search_collection_center',
    keywords: ['centro de acopio', 'acopio', 'donar ropa', 'donar comida', 'donaciones', 'punto de entrega', 'donde donar', 'llevar donaciones'],
    weight: 3,
  },
  {
    intent: 'search_campaign',
    keywords: ['campana', 'jornada', 'vacunacion', 'jornada medica', 'campanas activas', 'actividades', 'eventos'],
    weight: 3,
  },
  {
    intent: 'search_verified_info',
    keywords: ['informacion', 'info oficial', 'comunicado', 'que esta pasando', 'noticias', 'alertas', 'vias cerradas', 'servicios'],
    weight: 2,
  },
  {
    intent: 'create_help_request',
    keywords: ['necesito', 'necesitamos', 'ayuda', 'urgente', 'sos', 'auxilio', 'por favor', 'no tenemos agua', 'no tenemos comida', 'sin luz', 'sin agua', 'sin comida', 'atrapado', 'atrapada', 'emergencia', 'necesito agua', 'necesito comida', 'necesito medicinas'],
    weight: 3,
  },
  {
    intent: 'create_offer',
    keywords: ['ofrezco', 'quiero ayudar', 'puedo ayudar', 'tengo para donar', 'tengo agua', 'tengo comida', 'tengo vehiculo', 'tengo generador', 'disponible', 'voluntario', 'como ayudo'],
    weight: 3,
  },
  {
    intent: 'report_incident',
    keywords: ['derrumbe', 'incendio', 'inundacion', 'via cerrada', 'calle bloqueada', 'fuga de gas', 'cable caido', 'peligro', 'colapso', 'deslizamiento', 'arbol caido', 'explosion'],
    weight: 4,
  },
  {
    intent: 'greeting',
    keywords: ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos', 'que tal', 'hi', 'hello'],
    weight: 1,
  },
  {
    intent: 'help',
    keywords: ['ayuda', 'menu', 'opciones', 'que puedo hacer', 'como funciona', 'comandos', 'que es nodo', 'help'],
    weight: 1,
  },
]

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function classifyIntent(text: string): ClassifiedMessage {
  const normalized = normalize(text)
  const entities = extractEntities(text)

  const scores: Array<{ intent: Intent; score: number }> = []

  for (const rule of INTENT_RULES) {
    let score = 0
    for (const keyword of rule.keywords) {
      if (normalized.includes(normalize(keyword))) {
        score += keyword.length * rule.weight
      }
    }
    if (score > 0) {
      scores.push({ intent: rule.intent, score })
    }
  }

  if (scores.length === 0) {
    return { intent: 'unknown', confidence: 0, entities, rawText: text }
  }

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  const second = scores[1]

  const maxPossible = 100
  const confidence = Math.min(1, best.score / maxPossible)
  const separation = second ? (best.score - second.score) / best.score : 1

  const finalConfidence = confidence * 0.6 + separation * 0.4

  // Boost confidence with entity evidence
  let boosted = finalConfidence
  if (best.intent === 'search_person' && entities.some(e => e.type === 'person_name')) boosted = Math.min(1, boosted + 0.2)
  if (best.intent === 'search_health_request' && entities.some(e => e.type === 'blood_type')) boosted = Math.min(1, boosted + 0.2)
  if (best.intent === 'create_help_request' && entities.some(e => e.type === 'help_type')) boosted = Math.min(1, boosted + 0.15)

  return {
    intent: best.intent,
    confidence: Math.round(boosted * 100) / 100,
    entities,
    rawText: text,
  }
}
