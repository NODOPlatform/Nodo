import type { CampaignType, CampaignLocation } from '../types'

export interface ExtractedCampaign {
  title: string
  description: string
  campaignType: CampaignType
  organization: string | null
  startDate: string | null
  endDate: string | null
  openingHours: string | null
  locations: CampaignLocation[]
  requirements: string[]
  contactPhone: string | null
  whatsapp: string | null
  sourceUrl: string | null
  confidence: number
  fieldConfidence: Record<string, number>
}

const CAMPAIGN_TYPE_KEYWORDS: Record<CampaignType, string[]> = {
  blood_donation: ['sangre', 'donante', 'donacion de sangre', 'banco de sangre', 'plaquetas', 'hemocentro'],
  medical_day: ['jornada medica', 'jornada de salud', 'consulta medica', 'atencion medica'],
  vaccination: ['vacunacion', 'vacuna', 'inmunizacion', 'jornada de vacunacion'],
  food_collection: ['alimentos', 'recoleccion', 'comida', 'viveres', 'mercado solidario'],
  water_distribution: ['agua', 'distribucion de agua', 'agua potable', 'cisterna'],
  medicine_delivery: ['medicamento', 'medicina', 'farmacia', 'insumos medicos'],
  rescue: ['rescate', 'busqueda', 'rescatista', 'salvamento'],
  community_kitchen: ['olla comunitaria', 'cocina comunitaria', 'sancocho', 'comedor'],
  government: ['gobierno', 'gubernamental', 'ministerio', 'gobernacion', 'alcaldia'],
  ngo: ['ong', 'fundacion', 'cruz roja', 'unicef', 'caritas'],
  general: [],
}

function detectCampaignType(text: string): { type: CampaignType; confidence: number } {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  let bestType: CampaignType = 'general'
  let bestScore = 0

  for (const [type, keywords] of Object.entries(CAMPAIGN_TYPE_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (normalized.includes(kwNorm)) score += kw.length
    }
    if (score > bestScore) {
      bestScore = score
      bestType = type as CampaignType
    }
  }

  return { type: bestType, confidence: bestScore > 20 ? 0.95 : bestScore > 10 ? 0.8 : bestScore > 0 ? 0.6 : 0.3 }
}

function extractDates(text: string): { start: string | null; end: string | null; confidence: number } {
  const months: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  }

  const rangeMatch = text.match(/(\d{1,2})\s*(al|hasta|a|y)\s*(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/i)
  if (rangeMatch) {
    const year = rangeMatch[5] || new Date().getFullYear().toString()
    const month = months[rangeMatch[4].toLowerCase()] || '01'
    const startDay = rangeMatch[1].padStart(2, '0')
    const endDay = rangeMatch[3].padStart(2, '0')
    return { start: `${year}-${month}-${startDay}`, end: `${year}-${month}-${endDay}`, confidence: 0.9 }
  }

  const singleMatch = text.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/i)
  if (singleMatch) {
    const year = singleMatch[3] || new Date().getFullYear().toString()
    const month = months[singleMatch[2].toLowerCase()] || '01'
    const day = singleMatch[1].padStart(2, '0')
    return { start: `${year}-${month}-${day}`, end: null, confidence: 0.85 }
  }

  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return { start: isoMatch[0], end: null, confidence: 0.95 }
  }

  return { start: null, end: null, confidence: 0 }
}

function extractHours(text: string): { hours: string | null; confidence: number } {
  const match = text.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\s*(?:a|hasta|-)\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/i)
  if (match) return { hours: `${match[1]} a ${match[2]}`, confidence: 0.9 }

  const simpleMatch = text.match(/(\d{1,2})\s*(?:am|AM)\s*(?:a|hasta|-)\s*(\d{1,2})\s*(?:pm|PM)/i)
  if (simpleMatch) return { hours: `${simpleMatch[1]}:00 AM a ${simpleMatch[2]}:00 PM`, confidence: 0.85 }

  return { hours: null, confidence: 0 }
}

function extractPhones(text: string): { phone: string | null; whatsapp: string | null; confidence: number } {
  const phones: string[] = []
  const phonePattern = /(?:\+?58|0)\s*(?:\d[\s.-]*){9,10}/g
  const matches = text.match(phonePattern)
  if (matches) {
    matches.forEach(m => phones.push(m.replace(/[\s.-]/g, '')))
  }

  const waPattern = /whatsapp[:\s]*([+\d\s.-]+)/i
  const waMatch = text.match(waPattern)
  const whatsapp = waMatch ? waMatch[1].replace(/[\s.-]/g, '') : phones.length > 0 ? phones[0] : null

  return {
    phone: phones[0] || null,
    whatsapp,
    confidence: phones.length > 0 ? 0.85 : 0,
  }
}

function extractRequirements(text: string): { requirements: string[]; confidence: number } {
  const reqPatterns = [
    /requisitos?[:\s]*\n?((?:[-•*]\s*.+\n?)+)/i,
    /(?:debe|deben|necesita)[:\s]*\n?((?:[-•*]\s*.+\n?)+)/i,
  ]

  for (const pattern of reqPatterns) {
    const match = text.match(pattern)
    if (match) {
      const lines = match[1].split('\n')
        .map(l => l.replace(/^[-•*]\s*/, '').trim())
        .filter(l => l.length > 3)
      if (lines.length > 0) return { requirements: lines, confidence: 0.85 }
    }
  }

  const commonReqs: string[] = []
  const reqKeywords = [
    { pattern: /mayor(?:es)?\s+de\s+(\d+)\s+a[nñ]os/i, extract: (m: RegExpMatchArray) => `Mayor de ${m[1]} años` },
    { pattern: /m[aá]s\s+de\s+(\d+)\s*kg/i, extract: (m: RegExpMatchArray) => `Más de ${m[1]} kg` },
    { pattern: /sin\s+s[ií]ntomas/i, extract: () => 'Sin síntomas gripales' },
    { pattern: /c[eé]dula/i, extract: () => 'Presentar cédula de identidad' },
    { pattern: /ayunas/i, extract: () => 'Asistir en ayunas' },
  ]

  for (const req of reqKeywords) {
    const match = text.match(req.pattern)
    if (match) commonReqs.push(req.extract(match))
  }

  return { requirements: commonReqs, confidence: commonReqs.length > 0 ? 0.7 : 0 }
}

function extractLocations(text: string): { locations: CampaignLocation[]; confidence: number } {
  const locations: CampaignLocation[] = []

  const hospitalPattern = /(?:Hospital|Cl[ií]nica|Centro\s+M[eé]dico|Banco\s+(?:de\s+|Municipal\s+de\s+)?Sangre|Maternidad|Ambulatorio)\s+[A-ZÁÉÍÓÚa-záéíóú\s.]+/gi
  const matches = text.match(hospitalPattern) || []

  for (const m of matches) {
    const name = m.trim().replace(/\s+/g, ' ')
    if (name.length > 5 && !locations.some(l => l.name === name)) {
      locations.push({ name })
    }
  }

  return { locations, confidence: locations.length > 0 ? 0.75 : 0 }
}

export function extractCampaignFromText(text: string): ExtractedCampaign {
  const typeResult = detectCampaignType(text)
  const dateResult = extractDates(text)
  const hoursResult = extractHours(text)
  const phoneResult = extractPhones(text)
  const reqResult = extractRequirements(text)
  const locResult = extractLocations(text)

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const title = lines[0]?.substring(0, 120) || 'Campaña sin título'
  const description = lines.slice(1, 6).join('\n').substring(0, 500) || text.substring(0, 500)

  const orgPattern = /(?:organiza|presenta|patrocina|apoya)[:\s]+(.+)/i
  const orgMatch = text.match(orgPattern)

  const fieldConfidence: Record<string, number> = {
    title: title.length > 10 ? 0.9 : 0.5,
    description: description.length > 20 ? 0.85 : 0.4,
    campaignType: typeResult.confidence,
    dates: dateResult.confidence,
    hours: hoursResult.confidence,
    locations: locResult.confidence,
    requirements: reqResult.confidence,
    contacts: phoneResult.confidence,
    organization: orgMatch ? 0.7 : 0.3,
  }

  const weights = [0.15, 0.1, 0.2, 0.15, 0.1, 0.1, 0.1, 0.05, 0.05]
  const values = Object.values(fieldConfidence)
  const confidence = Math.round(values.reduce((sum, v, i) => sum + v * (weights[i] || 0.1), 0) * 100)

  return {
    title,
    description,
    campaignType: typeResult.type,
    organization: orgMatch?.[1]?.trim() || null,
    startDate: dateResult.start,
    endDate: dateResult.end,
    openingHours: hoursResult.hours,
    locations: locResult.locations,
    requirements: reqResult.requirements,
    contactPhone: phoneResult.phone,
    whatsapp: phoneResult.whatsapp,
    sourceUrl: null,
    confidence,
    fieldConfidence,
  }
}

export async function extractCampaignFromImage(imageFile: File): Promise<ExtractedCampaign> {
  const text = await ocrImage(imageFile)
  return extractCampaignFromText(text)
}

async function ocrImage(file: File): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const img = new Image()
  const url = URL.createObjectURL(file)

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = url
    })

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('spa+eng')
      const { data } = await worker.recognize(canvas)
      await worker.terminate()
      return (data.text || '').trim()
    } catch (err) {
      console.error('[campaign-extract] OCR error:', err)
    }

    return '[OCR no disponible — ingrese el texto manualmente]'
  } finally {
    URL.revokeObjectURL(url)
  }
}
