import type { Entity } from '../types'

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

const HELP_TYPE_MAP: Record<string, string> = {
  agua: 'water', comida: 'food', medicina: 'medicine', medicinas: 'medicine', medicamento: 'medicine',
  refugio: 'shelter', rescate: 'rescue', electricidad: 'electricity', luz: 'electricity',
  comunicacion: 'communication', transporte: 'transport', internet: 'communication',
}

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export function extractEntities(text: string): Entity[] {
  const entities: Entity[] = []
  const normalized = normalize(text)

  // Person name
  const namePatterns = [
    /busco a\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/i,
    /se busca\s+(?:a\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/i,
    /encontr[eé]\s+a\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/i,
    /(?:mi\s+)?(mama|papa|hijo|hija|hermano|hermana|esposo|esposa|abuelo|abuela|tio|tia)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/i,
  ]
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      const name = match[2] || match[1]
      entities.push({ type: 'person_name', value: name.trim(), confidence: 0.8 })
      break
    }
  }

  // Help types
  for (const [word, type] of Object.entries(HELP_TYPE_MAP)) {
    if (normalized.includes(word)) {
      entities.push({ type: 'help_type', value: type, confidence: 0.9 })
    }
  }

  // Blood type
  for (const bt of BLOOD_TYPES) {
    if (text.toUpperCase().includes(bt) || normalized.includes(bt.toLowerCase())) {
      entities.push({ type: 'blood_type', value: bt, confidence: 0.95 })
      break
    }
  }
  const bloodWords = normalized.match(/tipo\s+(o|a|b|ab)\s*(positivo|negativo|\+|-)/i)
  if (bloodWords && !entities.some(e => e.type === 'blood_type')) {
    const sign = bloodWords[2].startsWith('pos') || bloodWords[2] === '+' ? '+' : '-'
    entities.push({ type: 'blood_type', value: `${bloodWords[1].toUpperCase()}${sign}`, confidence: 0.85 })
  }

  // Phone
  const phoneMatch = text.match(/(?:\+58|0)[\s-]?(?:4\d{2}|2\d{2})[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/)
  if (phoneMatch) {
    entities.push({ type: 'phone', value: phoneMatch[0].replace(/[\s-]/g, ''), confidence: 0.95 })
  }

  // Age
  const ageMatch = text.match(/(\d{1,3})\s*(?:años|anos|years)/i)
  if (ageMatch) {
    const age = parseInt(ageMatch[1])
    if (age > 0 && age < 120) {
      entities.push({ type: 'age', value: String(age), confidence: 0.9 })
    }
  }

  // Urgency
  if (normalized.includes('urgente') || normalized.includes('sos') || normalized.includes('auxilio') || normalized.includes('emergencia')) {
    entities.push({ type: 'urgency', value: 'critical', confidence: 0.85 })
  } else if (normalized.includes('rapido') || normalized.includes('pronto')) {
    entities.push({ type: 'urgency', value: 'high', confidence: 0.7 })
  }

  // Location (city names)
  const cities = ['caracas', 'la guaira', 'guarenas', 'guatire', 'los teques', 'petare', 'chacao', 'baruta', 'el hatillo', 'catia', 'altamira']
  for (const city of cities) {
    if (normalized.includes(city)) {
      entities.push({ type: 'location', value: city.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), confidence: 0.85 })
      break
    }
  }

  return entities
}
