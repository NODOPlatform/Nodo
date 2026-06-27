export type ContentClass =
  | 'help_request'
  | 'help_offer'
  | 'campaign'
  | 'missing_person'
  | 'found_person'
  | 'collection_center'
  | 'shelter'
  | 'blood_request'
  | 'hospital'
  | 'incident'
  | 'verified_info'
  | 'alert'
  | 'community_kitchen'
  | 'lost_pet'
  | 'other'

export interface FieldExtraction {
  value: unknown
  confidence: number
}

export interface ClassificationResult {
  contentClass: ContentClass
  classConfidence: number
  title: string
  description: string
  fields: Record<string, FieldExtraction>
  rawText: string
  overallConfidence: number
  suggestions: string[]
}

interface ClassRule {
  type: ContentClass
  label: string
  keywords: string[]
  weight: number
}

const CLASS_RULES: ClassRule[] = [
  {
    type: 'missing_person', label: 'Persona desaparecida', weight: 5,
    keywords: ['se busca', 'busco a', 'ayudanos a encontrar', 'desaparecido', 'desaparecida', 'se encuentra desaparecido', 'extraviado', 'extraviada', 'no sabemos de', 'no aparece', 'perdido desde', 'perdida desde', 'ultima vez visto', 'la ultima vez', 'se perdio', 'missing', 'persona desaparecida', 'buscamos a'],
  },
  {
    type: 'found_person', label: 'Persona encontrada', weight: 5,
    keywords: ['fue encontrado', 'fue encontrada', 'fue localizado', 'fue localizada', 'aparecio', 'ya fue ubicado', 'ya fue ubicada', 'se encuentra en', 'esta en el hospital', 'esta a salvo', 'gracias a dios aparecio', 'localizado en'],
  },
  {
    type: 'blood_request', label: 'Solicitud de sangre', weight: 4,
    keywords: ['donante de sangre', 'donantes de sangre', 'necesita sangre', 'necesitan sangre', 'banco de sangre', 'grupo sanguineo', 'tipo de sangre', 'donacion de sangre', 'plaquetas', 'hemocentro', 'urgente sangre', 'donadores', 'se necesitan donantes', 'a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-'],
  },
  {
    type: 'campaign', label: 'Campana', weight: 3,
    keywords: ['jornada', 'campana', 'vacunacion', 'jornada medica', 'jornada de salud', 'medicamentos gratis', 'entrega de', 'distribucion de', 'atencion gratuita', 'consulta gratis', 'inscripciones abiertas', 'cupos disponibles', 'convocatoria'],
  },
  {
    type: 'community_kitchen', label: 'Olla comunitaria', weight: 3,
    keywords: ['olla comunitaria', 'cocina comunitaria', 'sancocho comunitario', 'comedor comunitario', 'almuerzo comunitario', 'comida gratis', 'plato de comida', 'raciones'],
  },
  {
    type: 'help_request', label: 'Solicitud de ayuda', weight: 2,
    keywords: ['necesitamos', 'necesito', 'urgente', 'ayuda urgente', 'sos', 'emergencia', 'auxilio', 'por favor ayuda', 'se necesita', 'nos falta', 'no tenemos', 'sin agua', 'sin luz', 'sin comida', 'atrapado', 'atrapada', 'derrumbe', 'inundacion'],
  },
  {
    type: 'help_offer', label: 'Oferta de ayuda', weight: 2,
    keywords: ['ofrezco', 'ofrecemos', 'puedo ayudar', 'disponible para', 'tengo para donar', 'quien necesite', 'puedo llevar', 'disponemos de', 'estamos regalando', 'donamos', 'repartiendo'],
  },
  {
    type: 'shelter', label: 'Refugio', weight: 3,
    keywords: ['refugio', 'albergue', 'centro de refugiados', 'espacio disponible', 'recibimos familias', 'alojamiento', 'hospedaje temporal', 'capacidad para', 'camas disponibles'],
  },
  {
    type: 'collection_center', label: 'Centro de acopio', weight: 3,
    keywords: ['centro de acopio', 'punto de acopio', 'recoleccion', 'donaciones', 'recibimos donaciones', 'punto de entrega', 'acopio', 'recepcion de', 'entrega de donativos'],
  },
  {
    type: 'incident', label: 'Incidente', weight: 3,
    keywords: ['derrumbe', 'explosion', 'incendio', 'inundacion', 'deslizamiento', 'colapso', 'puente caido', 'via cerrada', 'calle bloqueada', 'fuga de gas', 'cable caido', 'arbol caido', 'sin electricidad', 'sin agua potable', 'replica', 'sismo'],
  },
  {
    type: 'verified_info', label: 'Informacion verificada', weight: 2,
    keywords: ['comunicado oficial', 'informamos', 'aviso importante', 'boletin', 'nota de prensa', 'declaracion', 'se informa a la poblacion', 'gobierno nacional', 'proteccion civil', 'fuente oficial'],
  },
  {
    type: 'alert', label: 'Alerta', weight: 3,
    keywords: ['alerta', 'alerta roja', 'alerta amarilla', 'peligro', 'evacuacion', 'evacuar', 'zona de riesgo', 'no transitar', 'precaucion'],
  },
  {
    type: 'hospital', label: 'Hospital / Centro medico', weight: 2,
    keywords: ['hospital', 'clinica', 'centro medico', 'sala de emergencia', 'urgencias', 'atencion medica', 'quirofano', 'ambulatorio'],
  },
  {
    type: 'lost_pet', label: 'Animal perdido', weight: 2,
    keywords: ['perro perdido', 'gato perdido', 'mascota perdida', 'se busca mascota', 'perrito', 'gatito', 'animal perdido', 'se perdio mi perro', 'se perdio mi gato'],
  },
]

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function classify(text: string): { type: ContentClass; confidence: number; scores: Record<string, number> } {
  const norm = normalize(text)
  const scores: Record<string, number> = {}

  for (const rule of CLASS_RULES) {
    let score = 0
    for (const kw of rule.keywords) {
      const kwNorm = normalize(kw)
      if (norm.includes(kwNorm)) {
        score += kw.length * rule.weight
      }
    }
    scores[rule.type] = score
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const best = entries[0]
  const second = entries[1]

  if (!best || best[1] === 0) {
    return { type: 'other', confidence: 0.1, scores }
  }

  const separation = second && second[1] > 0 ? best[1] / (best[1] + second[1]) : 1
  const rawConfidence = Math.min(1, best[1] / 60)
  const confidence = rawConfidence * 0.6 + separation * 0.4

  return { type: best[0] as ContentClass, confidence: Math.round(confidence * 100) / 100, scores }
}

// --- Field extractors (reused patterns from campaign-extract.ts) ---

const MONTHS: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
}

function extractPersonName(text: string): FieldExtraction {
  const patterns = [
    /(?:se\s+busca\s+a|busco\s+a|ayudanos?\s+a\s+encontrar\s+a?|desaparecid[oa]:\s*|persona:\s*|nombre:\s*)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4})/i,
    /(?:fue\s+encontrad[oa]|fue\s+localizad[oa]|aparecio)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4})/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return { value: m[1].trim(), confidence: 0.85 }
  }
  return { value: null, confidence: 0 }
}

function extractAge(text: string): FieldExtraction {
  const m = text.match(/(\d{1,3})\s*a[nñ]os?\b/i)
  if (m) {
    const age = parseInt(m[1])
    if (age > 0 && age < 120) return { value: age, confidence: 0.9 }
  }
  return { value: null, confidence: 0 }
}

function extractBloodType(text: string): FieldExtraction {
  const m = text.match(/\b(A|B|AB|O)\s*([+-]|positivo|negativo)\b/i)
  if (m) {
    const sign = m[2].toLowerCase() === 'positivo' ? '+' : m[2].toLowerCase() === 'negativo' ? '-' : m[2]
    return { value: `${m[1].toUpperCase()}${sign}`, confidence: 0.95 }
  }
  return { value: null, confidence: 0 }
}

function extractDonorCount(text: string): FieldExtraction {
  const m = text.match(/(\d{1,3})\s*donante/i)
  if (m) return { value: parseInt(m[1]), confidence: 0.85 }
  return { value: null, confidence: 0 }
}

function extractPhones(text: string): { phone: FieldExtraction; whatsapp: FieldExtraction } {
  const phones: string[] = []
  const phonePattern = /(?:\+?58|0)\s*(?:\d[\s.-]*){9,10}/g
  const matches = text.match(phonePattern)
  if (matches) matches.forEach(m => phones.push(m.replace(/[\s.-]/g, '')))

  const waMatch = text.match(/whatsapp[:\s]*([+\d\s.-]+)/i)
  const wa = waMatch ? waMatch[1].replace(/[\s.-]/g, '') : phones.length > 0 ? phones[0] : null

  return {
    phone: { value: phones[0] || null, confidence: phones.length > 0 ? 0.85 : 0 },
    whatsapp: { value: wa, confidence: wa ? 0.8 : 0 },
  }
}

function extractDates(text: string): { startDate: FieldExtraction; endDate: FieldExtraction } {
  const rangeMatch = text.match(/(\d{1,2})\s*(?:al|hasta|a|y)\s*(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?/i)
  if (rangeMatch) {
    const year = rangeMatch[4] || new Date().getFullYear().toString()
    const month = MONTHS[rangeMatch[3].toLowerCase()] || '01'
    return {
      startDate: { value: `${year}-${month}-${rangeMatch[1].padStart(2, '0')}`, confidence: 0.9 },
      endDate: { value: `${year}-${month}-${rangeMatch[2].padStart(2, '0')}`, confidence: 0.9 },
    }
  }

  const singleMatch = text.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?/i)
  if (singleMatch) {
    const year = singleMatch[3] || new Date().getFullYear().toString()
    const month = MONTHS[singleMatch[2].toLowerCase()] || '01'
    return {
      startDate: { value: `${year}-${month}-${singleMatch[1].padStart(2, '0')}`, confidence: 0.85 },
      endDate: { value: null, confidence: 0 },
    }
  }

  return { startDate: { value: null, confidence: 0 }, endDate: { value: null, confidence: 0 } }
}

function extractHours(text: string): FieldExtraction {
  const m = text.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*(?:a|hasta|-)\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/i)
  if (m) return { value: `${m[1]} a ${m[2]}`, confidence: 0.9 }

  const simple = text.match(/(\d{1,2})\s*(?:am)\s*(?:a|hasta|-)\s*(\d{1,2})\s*(?:pm)/i)
  if (simple) return { value: `${simple[1]}:00 AM a ${simple[2]}:00 PM`, confidence: 0.85 }

  return { value: null, confidence: 0 }
}

function extractLocations(text: string): FieldExtraction {
  const locations: string[] = []

  const patterns = [
    /(?:Hospital|Cl[ií]nica|Centro\s+M[eé]dico|Banco\s+(?:de\s+|Municipal\s+de\s+)?Sangre|Maternidad|Ambulatorio|Refugio|Albergue)\s+[A-ZÁÉÍÓÚa-záéíóú\s.]+/gi,
    /(?:en\s+(?:el|la|los|las)\s+)([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚa-záéíóúñ]+){1,5})/g,
  ]

  for (const p of patterns) {
    const matches = text.match(p) || []
    for (const m of matches) {
      const name = m.replace(/^en\s+(?:el|la|los|las)\s+/i, '').trim().replace(/\s+/g, ' ')
      if (name.length > 5 && !locations.includes(name)) {
        locations.push(name)
      }
    }
  }

  return { value: locations.length > 0 ? locations : null, confidence: locations.length > 0 ? 0.7 : 0 }
}

function extractUrgency(text: string): FieldExtraction {
  const norm = normalize(text)
  if (/\b(critico|critica|emergencia|vida o muerte|riesgo vital|urgente.*inmediato)\b/.test(norm))
    return { value: 'critical', confidence: 0.9 }
  if (/\b(urgente|con urgencia|cuanto antes|lo antes posible)\b/.test(norm))
    return { value: 'high', confidence: 0.85 }
  if (/\b(importante|se necesita|necesario)\b/.test(norm))
    return { value: 'medium', confidence: 0.7 }
  return { value: 'medium', confidence: 0.4 }
}

function extractRequirements(text: string): FieldExtraction {
  const reqPattern = /requisitos?[:\s]*\n?((?:[-•*]\s*.+\n?)+)/i
  const m = text.match(reqPattern)
  if (m) {
    const lines = m[1].split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(l => l.length > 3)
    if (lines.length > 0) return { value: lines, confidence: 0.85 }
  }

  const commonReqs: string[] = []
  if (/mayor(?:es)?\s+de\s+(\d+)\s+a[nñ]os/i.test(text)) commonReqs.push('Mayor de edad')
  if (/c[eé]dula/i.test(text)) commonReqs.push('Presentar cedula de identidad')
  if (/ayunas/i.test(text)) commonReqs.push('Asistir en ayunas')

  return { value: commonReqs.length > 0 ? commonReqs : null, confidence: commonReqs.length > 0 ? 0.7 : 0 }
}

function extractDescription(text: string): FieldExtraction {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const desc = lines.slice(1, 8).join('\n').substring(0, 600) || text.substring(0, 600)
  return { value: desc, confidence: desc.length > 30 ? 0.8 : 0.4 }
}

function extractOrganization(text: string): FieldExtraction {
  const patterns = [
    /(?:organiza|presenta|patrocina|apoya|convoca)[:\s]+(.+)/i,
    /(?:Cruz\s+Roja|Proteccion\s+Civil|Bomberos|UNICEF|Caritas|Fundacion\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return { value: (m[1] || m[0]).trim().substring(0, 100), confidence: 0.75 }
  }
  return { value: null, confidence: 0 }
}

function extractHelpTypes(text: string): FieldExtraction {
  const norm = normalize(text)
  const typeMap: Record<string, string[]> = {
    water: ['agua', 'agua potable', 'cisterna', 'botellon'],
    food: ['comida', 'alimento', 'viveres', 'mercado', 'arroz', 'harina'],
    medicine: ['medicina', 'medicamento', 'farmacia', 'pastillas', 'insumo medico'],
    shelter: ['refugio', 'albergue', 'techo', 'hospedaje', 'alojamiento'],
    rescue: ['rescate', 'atrapado', 'derrumbe', 'salvamento'],
    electricity: ['electricidad', 'luz', 'planta electrica', 'generador'],
    communication: ['comunicacion', 'internet', 'telefono', 'senal', 'starlink'],
    transport: ['transporte', 'vehiculo', 'traslado', 'ambulancia'],
  }
  const found: string[] = []
  for (const [type, kws] of Object.entries(typeMap)) {
    for (const kw of kws) {
      if (norm.includes(normalize(kw))) { found.push(type); break }
    }
  }
  return { value: found.length > 0 ? found : null, confidence: found.length > 0 ? 0.8 : 0 }
}

function buildTitle(text: string, contentClass: ContentClass): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const firstLine = lines[0]?.substring(0, 120) || ''

  const defaults: Partial<Record<ContentClass, string>> = {
    missing_person: 'Persona desaparecida',
    found_person: 'Persona encontrada',
    blood_request: 'Solicitud de sangre',
    help_request: 'Solicitud de ayuda',
    help_offer: 'Oferta de ayuda',
    campaign: 'Campana',
    shelter: 'Refugio',
    collection_center: 'Centro de acopio',
    incident: 'Incidente reportado',
    community_kitchen: 'Olla comunitaria',
    verified_info: 'Informacion verificada',
    alert: 'Alerta',
    hospital: 'Hospital',
    lost_pet: 'Animal perdido',
  }

  return firstLine || defaults[contentClass] || 'Contenido sin titulo'
}

// --- Main public API ---

export function classifyContent(text: string): ClassificationResult {
  const classification = classify(text)
  const title = buildTitle(text, classification.type)
  const desc = extractDescription(text)

  const fields: Record<string, FieldExtraction> = {
    description: desc,
    urgency: extractUrgency(text),
    locations: extractLocations(text),
    hours: extractHours(text),
    organization: extractOrganization(text),
  }

  const phonesResult = extractPhones(text)
  fields.phone = phonesResult.phone
  fields.whatsapp = phonesResult.whatsapp

  const datesResult = extractDates(text)
  fields.startDate = datesResult.startDate
  fields.endDate = datesResult.endDate

  // Class-specific extractions
  if (classification.type === 'missing_person' || classification.type === 'found_person') {
    fields.personName = extractPersonName(text)
    fields.age = extractAge(text)
  }

  if (classification.type === 'blood_request') {
    fields.bloodType = extractBloodType(text)
    fields.donorCount = extractDonorCount(text)
  }

  if (classification.type === 'help_request' || classification.type === 'help_offer') {
    fields.helpTypes = extractHelpTypes(text)
  }

  if (classification.type === 'campaign' || classification.type === 'community_kitchen') {
    fields.requirements = extractRequirements(text)
  }

  // Overall confidence
  const fieldValues = Object.values(fields)
  const filledFields = fieldValues.filter(f => f.confidence > 0.5).length
  const fieldCoverage = fieldValues.length > 0 ? filledFields / fieldValues.length : 0
  const overallConfidence = Math.round((classification.confidence * 0.6 + fieldCoverage * 0.4) * 100)

  // Suggestions
  const suggestions: string[] = []
  if (classification.confidence < 0.5) suggestions.push('La clasificacion tiene baja confianza. Revise el tipo manualmente.')
  if (!fields.locations?.value) suggestions.push('No se detectaron ubicaciones. Agregue una ubicacion.')
  if (!fields.phone?.value && !fields.whatsapp?.value) suggestions.push('No se detecto contacto. Agregue un telefono o WhatsApp.')
  if (classification.type === 'blood_request' && !fields.bloodType?.value) suggestions.push('No se detecto grupo sanguineo.')
  if (classification.type === 'missing_person' && !fields.personName?.value) suggestions.push('No se detecto nombre de la persona.')

  return {
    contentClass: classification.type,
    classConfidence: classification.confidence,
    title,
    description: (desc.value as string) || text.substring(0, 500),
    fields,
    rawText: text,
    overallConfidence,
    suggestions,
  }
}

// --- OCR via tesseract.js ---

export type OcrProgressCallback = (progress: number, status: string) => void

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo cargar la imagen')) }
    img.src = url
  })
}

function imageToCanvas(img: HTMLImageElement, enhance: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)

  if (enhance) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
      const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
      const contrast = ((gray - 128) * 1.5) + 128
      const v = Math.max(0, Math.min(255, contrast))
      d[i] = d[i + 1] = d[i + 2] = v
    }
    ctx.putImageData(imageData, 0, 0)
  }

  return canvas
}

async function runTesseract(canvas: HTMLCanvasElement, onProgress?: OcrProgressCallback): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('spa+eng', undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), 'Reconociendo texto...')
      }
    },
  })
  try {
    const { data } = await worker.recognize(canvas)
    return (data.text || '').trim()
  } finally {
    await worker.terminate()
  }
}

export async function ocrImage(file: File, onProgress?: OcrProgressCallback): Promise<string> {
  const img = await loadImage(file)

  onProgress?.(5, 'Imagen cargada. Iniciando OCR...')

  // Attempt 1: original image
  try {
    const canvas = imageToCanvas(img, false)
    const text = await runTesseract(canvas, onProgress)
    if (text.length >= 10) return text

    // Attempt 2: enhanced (grayscale + contrast)
    onProgress?.(60, 'Poco texto detectado. Reintentando con imagen mejorada...')
    const enhanced = imageToCanvas(img, true)
    const text2 = await runTesseract(enhanced, (p, s) => onProgress?.(60 + Math.round(p * 0.4), s))
    if (text2.length > text.length) return text2
    return text || text2
  } catch (err) {
    console.error('[OCR] Error en Tesseract:', err)
    throw err
  }
}

export async function classifyImage(file: File, onProgress?: OcrProgressCallback): Promise<ClassificationResult> {
  let text = ''
  try {
    text = await ocrImage(file, onProgress)
  } catch (err) {
    console.error('[OCR] classifyImage error:', err)
  }
  if (!text) {
    return {
      contentClass: 'other',
      classConfidence: 0,
      title: 'Imagen sin texto detectado',
      description: '',
      fields: {},
      rawText: '',
      overallConfidence: 0,
      suggestions: ['No se detecto texto en la imagen. Puede publicar la imagen manualmente o pegar el texto.'],
    }
  }
  return classifyContent(text)
}

// --- Content class labels for UI ---

export const CONTENT_CLASS_LABELS: Record<ContentClass, { label: string; icon: string; color: string }> = {
  help_request: { label: 'Solicitud de ayuda', icon: '🆘', color: '#f59e0b' },
  help_offer: { label: 'Oferta de ayuda', icon: '🤝', color: '#10b981' },
  campaign: { label: 'Campana', icon: '📢', color: '#8b5cf6' },
  missing_person: { label: 'Persona desaparecida', icon: '🔍', color: '#ef4444' },
  found_person: { label: 'Persona encontrada', icon: '✅', color: '#22c55e' },
  collection_center: { label: 'Centro de acopio', icon: '📦', color: '#92400e' },
  shelter: { label: 'Refugio', icon: '🏠', color: '#6366f1' },
  blood_request: { label: 'Solicitud de sangre', icon: '🩸', color: '#dc2626' },
  hospital: { label: 'Hospital', icon: '🏥', color: '#3b82f6' },
  incident: { label: 'Incidente', icon: '🚨', color: '#ef4444' },
  verified_info: { label: 'Info verificada', icon: '📋', color: '#06b6d4' },
  alert: { label: 'Alerta', icon: '⚠️', color: '#f97316' },
  community_kitchen: { label: 'Olla comunitaria', icon: '🍲', color: '#d97706' },
  lost_pet: { label: 'Animal perdido', icon: '🐾', color: '#a855f7' },
  other: { label: 'Otro', icon: '📄', color: '#64748b' },
}
