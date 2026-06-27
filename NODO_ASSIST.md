# NODO Assist — Documentacion Tecnica

**Version:** 1.0
**Fecha:** 2026-06-27
**Estado:** Arquitectura completa, sin conexion a Meta

---

## Que es NODO Assist

NODO Assist es la interfaz conversacional oficial de NODO. Permite que cualquier persona acceda a toda la plataforma NODO escribiendo un mensaje de WhatsApp (o Telegram, SMS, Web en el futuro) como si hablara con una persona.

No es un chatbot con menus. Es una interfaz de lenguaje natural.

---

## Arquitectura

```
  Usuario (WhatsApp / Telegram / SMS / Web)
         │
         ▼
  ┌──────────────────┐
  │    Providers      │   ← Adaptan cada canal a IncomingMessage
  │  whatsapp.ts      │
  │  (telegram.ts)    │
  │  (sms.ts)         │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │     Router        │   ← Punto de entrada unico
  │   router.ts       │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │   AI Layer        │   ← Clasifica intencion + extrae entidades
  │ intentClassifier  │
  │ entityExtractor   │
  │ responseBuilder   │
  │ prompts           │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │    Handlers       │   ← Un handler por intencion
  │ searchPerson      │
  │ searchShelter     │
  │ searchHospital    │
  │ createHelpRequest │
  │ ...               │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │    Services       │   ← Consultas a Supabase + matching
  │ search.ts         │
  │ matching.ts       │
  │ supabase.ts       │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │    Supabase       │   ← Mismas tablas que la app web
  │  (PostgreSQL)     │
  └──────────────────┘
```

### Principio fundamental

**Toda la logica de datos vive en `services/`.** Los handlers solo formatean respuestas. Si un dato ya se consulta en la app web, NODO Assist usa la misma tabla y la misma query.

---

## Estructura de archivos

```
src/assist/
├── router.ts                    # Punto de entrada: handleMessage()
├── config.ts                    # Configuracion general
├── types.ts                     # Tipos compartidos
├── ai/
│   ├── intentClassifier.ts      # Clasificador de intencion (reglas)
│   ├── entityExtractor.ts       # Extractor de entidades
│   ├── responseBuilder.ts       # Constructor de respuestas
│   └── prompts.ts               # Prompts para LLM (futuro)
├── handlers/
│   ├── searchPerson.ts          # Buscar persona desaparecida
│   ├── searchShelter.ts         # Buscar refugio
│   ├── searchHospital.ts        # Buscar hospital
│   ├── searchCollectionCenter.ts # Buscar centro de acopio
│   ├── searchCampaign.ts        # Buscar campana activa
│   ├── searchHealthRequest.ts   # Buscar solicitud de sangre
│   ├── searchVerifiedInfo.ts    # Buscar informacion verificada
│   ├── createHelpRequest.ts     # Crear solicitud de ayuda
│   ├── createOffer.ts           # Registrar oferta de ayuda
│   ├── reportIncident.ts        # Reportar incidente
│   └── reportFoundPerson.ts     # Reportar persona encontrada
├── providers/
│   └── whatsapp.ts              # Adapter WhatsApp Cloud API
└── services/
    ├── supabase.ts              # Cliente Supabase para Assist
    ├── search.ts                # Queries de busqueda (7 tablas)
    └── matching.ts              # Motor de matching necesidad ↔ recurso
```

---

## Flujo de un mensaje

1. **Provider** recibe webhook del canal (WhatsApp)
2. **Provider** normaliza a `IncomingMessage` universal
3. **Router** recibe el mensaje
4. **IntentClassifier** clasifica la intencion (14 posibles) + extrae entidades
5. **Router** despacha al handler correspondiente
6. **Handler** usa `services/` para consultar Supabase
7. **Handler** retorna `HandlerResult` con mensajes de respuesta
8. **Provider** envia la respuesta por el canal original

---

## Intenciones soportadas

| Intent | Ejemplo de mensaje | Handler |
|--------|-------------------|---------|
| `search_person` | "Busco a Maria Gonzalez" | searchPerson.ts |
| `search_shelter` | "Necesito un refugio" | searchShelter.ts |
| `search_hospital` | "Donde hay un hospital" | searchHospital.ts |
| `search_health_request` | "Quiero donar sangre O+" | searchHealthRequest.ts |
| `search_collection_center` | "Donde puedo donar ropa" | searchCollectionCenter.ts |
| `search_campaign` | "Que campanas hay activas" | searchCampaign.ts |
| `search_verified_info` | "Que esta pasando" | searchVerifiedInfo.ts |
| `create_help_request` | "Necesito agua urgente" | createHelpRequest.ts |
| `create_offer` | "Quiero ayudar" | createOffer.ts |
| `report_incident` | "Hay un derrumbe en Catia" | reportIncident.ts |
| `report_found_person` | "Encontre a un nino" | reportFoundPerson.ts |
| `greeting` | "Hola" | (inline: bienvenida) |
| `help` | "Menu" | (inline: lista de opciones) |
| `unknown` | (no clasificable) | (inline: ayuda) |

---

## Entidades extraidas

| Tipo | Ejemplo | Usado por |
|------|---------|-----------|
| `person_name` | "Maria Gonzalez" | searchPerson |
| `help_type` | water, food, medicine... | createHelpRequest, createOffer |
| `blood_type` | "O+", "AB-" | searchHealthRequest |
| `phone` | "+584141234567" | todos (contacto) |
| `age` | "45 anos" | searchPerson |
| `urgency` | critical, high | createHelpRequest |
| `location` | "Caracas", "Catia" | todos (filtro por ciudad) |
| `description` | texto libre | reportIncident |

---

## Como conectar WhatsApp Cloud API

### Requisitos

1. Cuenta en [Meta for Developers](https://developers.facebook.com)
2. App creada con producto "WhatsApp"
3. Numero de telefono verificado
4. Token de acceso permanente

### Configuracion

Variables de entorno necesarias:

```
WHATSAPP_VERIFY_TOKEN=tu_token_de_verificacion
WHATSAPP_ACCESS_TOKEN=tu_token_de_acceso
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
```

### Webhook de verificacion (GET)

```typescript
import { verifyWebhook } from './providers/whatsapp'

// En tu endpoint GET /webhook
const challenge = verifyWebhook(req.query, VERIFY_TOKEN)
if (challenge) return res.send(challenge)
return res.sendStatus(403)
```

### Webhook de mensajes (POST)

```typescript
import { parseWebhook } from './providers/whatsapp'
import { handleMessage } from './router'
import { sendMessage } from './providers/whatsapp'

// En tu endpoint POST /webhook
const incoming = parseWebhook(req.body)
if (!incoming) return res.sendStatus(200)

const result = await handleMessage(incoming)
for (const msg of result.messages) {
  await sendMessage(msg, config)
}
res.sendStatus(200)
```

### Servidor recomendado

Opciones compatibles con Vercel:
- **Vercel Serverless Functions** (API routes)
- **Edge Functions** (mas rapido)
- **Servidor externo** (Express, Fastify, Hono)

---

## Como agregar Telegram

1. Crear archivo `src/assist/providers/telegram.ts`
2. Implementar:
   - `parseTelegramUpdate(update)` → `IncomingMessage` con `channel: 'telegram'`
   - `sendTelegramMessage(msg, botToken)` → enviar via Telegram Bot API
3. El router y handlers no necesitan cambios — trabajan con `IncomingMessage` universal

```typescript
// src/assist/providers/telegram.ts
import type { IncomingMessage, OutgoingMessage } from '../types'

export function parseTelegramUpdate(update: TelegramUpdate): IncomingMessage | null {
  const msg = update.message
  if (!msg) return null

  return {
    channel: 'telegram',
    senderId: String(msg.chat.id),
    senderName: [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' '),
    text: msg.text || '',
    timestamp: msg.date * 1000,
    location: msg.location ? { lat: msg.location.latitude, lng: msg.location.longitude } : undefined,
  }
}
```

---

## Como agregar SMS

1. Crear `src/assist/providers/sms.ts`
2. Usar Twilio o similar para recibir/enviar SMS
3. Parsear a `IncomingMessage` con `channel: 'sms'`
4. Las respuestas deben ser mas cortas (limite 160 caracteres por segmento)

---

## Como agregar nuevos comandos

1. Definir nueva intencion en `types.ts` → agregar al tipo `Intent`
2. Agregar keywords en `intentClassifier.ts` → nuevo `IntentRule`
3. Crear handler en `handlers/nuevoHandler.ts`
4. Registrar en `router.ts` → agregar al `HANDLER_MAP`
5. Si necesita datos de Supabase, agregar query en `services/search.ts`

---

## Reemplazo del clasificador por LLM

La arquitectura esta preparada para reemplazar el clasificador basado en reglas por un LLM:

1. `prompts.ts` ya contiene los prompts del sistema y de clasificacion
2. Solo necesitas modificar `intentClassifier.ts`:
   - Importar cliente de OpenAI/Anthropic
   - Enviar `SYSTEM_PROMPT` + `INTENT_PROMPT` + mensaje del usuario
   - Parsear la respuesta como `Intent`
   - Mantener el entity extractor como backup/complemento
3. Los handlers y services no cambian

```typescript
// Ejemplo futuro con Claude
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, INTENT_PROMPT } from './prompts'

export async function classifyWithLLM(text: string): Promise<ClassifiedMessage> {
  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `${INTENT_PROMPT}\n\nMensaje: "${text}"` }],
    max_tokens: 50,
  })
  const intent = response.content[0].text.trim() as Intent
  const entities = extractEntities(text)
  return { intent, confidence: 0.95, entities, rawText: text }
}
```

---

## Buenas practicas

1. **No duplicar logica.** Si la app web ya consulta una tabla, usa la misma query en `services/search.ts`.
2. **Respuestas cortas.** Las personas en emergencia no leen parrafos.
3. **Siempre dar un siguiente paso.** Nunca dejar al usuario sin saber que hacer despues.
4. **Incluir link a la app.** Para acciones complejas (crear solicitud, registrar persona), redirigir a nodoayuda.com.
5. **Ubicacion es oro.** Siempre pedir ubicacion cuando sea relevante para mejorar resultados.
6. **No publicar automaticamente.** NODO Assist muestra datos, no crea registros directamente (la persona debe completar el formulario web).

---

## Escalabilidad futura

La arquitectura soporta sin reescritura:

| Feature | Donde se implementa |
|---------|-------------------|
| IA conversacional (Claude/GPT) | `ai/intentClassifier.ts` |
| Imagenes | Provider → `mediaUrl` + nuevo handler OCR |
| OCR desde WhatsApp | Handler que usa `universal-classifier.ts` |
| Ubicacion GPS | Provider → `location` (ya soportado) |
| Notas de voz | Provider → `mediaType: 'audio'` + transcripcion |
| Alertas sismicas | Nuevo handler + `seismic.ts` store |
| Campanas automaticas | Nuevo handler + scheduler |
| Matching automatico | Ya implementado en `services/matching.ts` |
| Nuevos canales | Nuevo archivo en `providers/` |
| Contexto conversacional | Session store por senderId |
