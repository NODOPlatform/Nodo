# NODO — Flujo de Datos

Este documento describe como fluyen los datos desde el usuario hasta la visualizacion final, para cada tipo de contenido.

---

## Flujo General

```
Usuario
  │
  ▼
Formulario (Page)
  │
  ├──── Online ────► Supabase INSERT
  │                      │
  └──── Offline ───► IndexedDB (Dexie)
                         │
                    processQueue() cada 15s
                         │
                         ▼
                    Supabase INSERT
                         │
                         ▼
                 ┌───────┴───────────────────────┐
                 │                               │
           Store (signal)                  Motor IA
           loadXxx()                   intelligence.ts
                 │                               │
                 ├── trends                      │
                 ├── insights                    │
                 ├── matching                    │
                 └── mission                     │
                         │                       │
                         ▼                       │
                    Componente UI ◄──────────────┘
                    (renderiza signal)
                         │
                         ▼
                    ┌────┴─────┐
                    │          │
               Dashboard    Mapa
                    │          │
                    ▼          ▼
                 Feed      Markers
                    │          │
                    ▼          ▼
                 Usuario ve datos actualizados
```

---

## Flujo por Tipo de Contenido

### Solicitudes de Ayuda (help_requests)

```
Usuario → /necesito-ayuda
  │
  Formulario:
  ├── help_types[] (water, food, medicine, shelter, rescue, electricity, communication, transport, other)
  ├── urgency (low, medium, high, critical)
  ├── people_count
  ├── latitude, longitude (GPS o manual)
  ├── city, sector, address
  ├── contact_method + contact_value
  ├── photo_url (comprimida a 800px, 60% JPEG)
  ├── device_id (UUID persistente)
  └── offline_id (UUID unico por envio)
  │
  ▼
Supabase: help_requests
  status = 'pending'
  │
  ▼
Consumed by:
  ├── live-stats.ts      → liveStats.requests (count)
  ├── coordination.ts    → nearbyNeeds[] (scored by distance/urgency/age)
  ├── national-feed.ts   → nationalFeed[] (timeline item)
  ├── intelligence.ts    → insights[], trends[], matchSuggestions[]
  ├── priorities.ts      → priorityNeeds[] (aggregated by type)
  └── MapView.tsx         → map marker (help_request layer)
```

### Ofertas de Ayuda (help_offers)

```
Usuario → /quiero-ayudar
  │
  Formulario:
  ├── offer_types[] (20 tipos: food, water, vehicle, doctor, generator, shelter_space, etc.)
  ├── available_hours
  ├── contact_name, contact_method, contact_value
  ├── latitude, longitude
  ├── city, sector
  └── device_id, offline_id
  │
  ▼
Supabase: help_offers
  status = 'available'
  │
  ▼
Consumed by:
  ├── live-stats.ts      → liveStats.offers (count)
  ├── coordination.ts    → nearbyNeeds[] (tipo 'offer')
  ├── national-feed.ts   → nationalFeed[] (timeline item)
  ├── intelligence.ts    → matchSuggestions[] (matched contra requests)
  └── MapView.tsx         → map marker (help_offer layer)
```

### Personas Desaparecidas (persons)

```
Usuario → /buscar-persona (search)
       → Formulario de reporte (crear)
  │
  Formulario:
  ├── name (nombre completo)
  ├── age
  ├── description
  ├── photo_url
  ├── last_known_lat, last_known_lng
  ├── current_status (unknown, ok, injured, medical_attention, transferred, with_family)
  ├── is_found (boolean)
  ├── contact_method, contact_value
  └── device_id, offline_id
  │
  ▼
Supabase: persons
  is_found = false (desaparecida) / true (encontrada)
  │
  ├── person_status_history → historial de ubicacion/estado
  │
  ▼
Consumed by:
  ├── live-stats.ts      → liveStats.personsFound (count is_found=true)
  ├── national-feed.ts   → nationalFeed[] (timeline item)
  ├── location-search.ts → searchAll() results
  └── MapView.tsx         → map marker (person_found layer)

Busqueda externa (SearchPerson.tsx):
  ├── desaparecidosterremotovenezuela.com
  └── hospitalesenvenezuela.com
```

### Solicitudes de Salud (health_request via POI)

```
Usuario → /solicitud-salud
  │
  Formulario:
  ├── health_type (blood_donors, platelet_donors, medication, oxygen, medical_supplies, equipment, infant_formula, breast_milk, other)
  ├── priority (critical, high, medium, low)
  ├── blood_type (A+, A-, B+, B-, AB+, AB-, O+, O-, not_applicable)
  ├── donor_count (cantidad necesaria)
  ├── hospital_name (autocompletado de 23 hospitales conocidos)
  ├── latitude, longitude
  ├── contact_method, contact_value
  └── device_id, offline_id
  │
  ▼
Supabase: points_of_interest
  poi_type = 'health_request'
  metadata = { health_type, blood_type, donor_count, donors_confirmed, priority, hospital_name, status }
  │
  ▼
Consumed by:
  ├── live-stats.ts      → liveStats.healthRequests (count)
  ├── coordination.ts    → nearbyNeeds[] (tipo 'health_request')
  ├── national-feed.ts   → nationalFeed[] (timeline item)
  ├── intelligence.ts    → insights[] (sangre sin atender), missionOfTheDay (donacion)
  ├── HomeMiniMap.tsx     → mini markers
  └── MapView.tsx         → map marker (health_request layer, color por prioridad)
```

### Campanas Oficiales (official_campaigns)

```
Admin → /admin → Campanas
     → Ingesta Inteligente (clasificador detecta campana)
  │
  Formulario:
  ├── title, description
  ├── campaign_type (blood_donation, medical_day, vaccination, food_collection, water_distribution, medicine_delivery, rescue, community_kitchen, government, ngo, general)
  ├── organization
  ├── start_date, end_date, opening_hours
  ├── locations[] → [{name, address, lat, lng, city}]
  ├── requirements[]
  ├── verification_level (unverified, community, nodo, official)
  ├── contact_phone, whatsapp, website
  ├── image_url, source_url
  └── status (draft, active, completed, cancelled)
  │
  ▼
Supabase: official_campaigns
  │
  ▼
Consumed by:
  ├── campaigns.ts       → campaigns[] signal
  ├── live-stats.ts      → liveStats.campaigns (count)
  ├── coordination.ts    → nearbyNeeds[] (tipo 'campaign')
  ├── national-feed.ts   → nationalFeed[] (timeline item)
  ├── intelligence.ts    → insights[] (campanas activas), matchSuggestions[]
  ├── location-search.ts → searchAll() results
  └── MapView.tsx         → map marker (campaign layer, morado)
```

### Refugios (shelters)

```
Admin → /admin → Refugios
     → /admin/refugios (CRUD completo)
  │
  Formulario:
  ├── name, address
  ├── latitude, longitude
  ├── city, state_name
  ├── capacity, current_occupancy
  ├── amenities: water, food, electricity, bathrooms, internet, medical, sleeping (booleans)
  ├── accepts: pets, children, elderly, disabled (booleans)
  ├── phone, responsible
  ├── notes
  └── status (active, full, closed)
  │
  ▼
Supabase: shelters
  │
  ▼
Consumed by:
  ├── live-stats.ts      → liveStats.shelters (count active)
  ├── national-feed.ts   → (via POI shelter type)
  ├── intelligence.ts    → insights[] (capacidad disponible), matchSuggestions[]
  ├── HomeMiniMap.tsx     → mini markers
  ├── location-search.ts → searchAll() results
  ├── MapView.tsx         → map marker (shelter layer)
  └── Shelters.tsx        → listado completo
```

### Incidentes (points_of_interest)

```
Usuario → /reportar-incidente
  │
  Formulario:
  ├── incident_type (bridge_down, landslide, flood, fire, fallen_tree, electric_cable, gas_leak, collapsed_building, blocked_street, no_electricity, no_water, other)
  ├── description
  ├── photo_url
  ├── latitude, longitude
  ├── city, sector
  ├── observed_state
  ├── people_count
  └── device_id, offline_id
  │
  ▼
Supabase: points_of_interest
  poi_type = 'incident'
  metadata = { incident_type, description, photo_url, observed_state, people_count }
  │
  ▼
Consumed by:
  ├── live-stats.ts      → liveStats.incidents (count)
  ├── national-feed.ts   → nationalFeed[] (timeline item)
  └── MapView.tsx         → map marker (incident layer, rojo)
```

### Informacion Verificada (verified_info)

```
Admin → /admin → (gestion de info)
     → Ingesta Inteligente (clasificador detecta info verificada)
  │
  Campos:
  ├── category (hospital, road, shelter, distribution, services, etc.)
  ├── content (texto)
  ├── source
  ├── is_pinned
  └── expires_at
  │
  ▼
Supabase: verified_info
  │
  ▼
Consumed by:
  ├── national-feed.ts   → nationalFeed[] (timeline item)
  └── VerifiedInfo.tsx    → listado filtrable por categoria
```

---

## Flujo de la Ingesta Inteligente

```
Admin sube imagen o pega texto
         │
         ▼
    ┌────────────┐
    │  OCR       │ (si imagen)
    │ Canvas API │
    │ Tesseract  │
    └─────┬──────┘
          │ texto extraido
          ▼
    ┌────────────────┐
    │  classify()    │
    │  15 tipos      │
    │  keywords×peso │
    └─────┬──────────┘
          │ contentClass + confidence
          ▼
    ┌────────────────┐
    │  extractors    │
    │  12 funciones  │
    │  regex-based   │
    └─────┬──────────┘
          │ fields + per-field confidence
          ▼
    ┌────────────────┐
    │  suggestions   │
    │  campos faltantes│
    └─────┬──────────┘
          │
          ▼
    ┌────────────────────────┐
    │  REVISION HUMANA       │
    │  Admin ve:             │
    │  - Tipo detectado      │
    │  - Confidence badge    │
    │  - Campos extraidos    │
    │  - Sugerencias         │
    │  - Override tipo       │
    │  - Boton "Publicar"    │
    └─────┬──────────────────┘
          │ Admin aprueba
          ▼
    ┌────────────────┐
    │  publish()     │
    │  INSERT a:     │
    │  - persons     │
    │  - help_requests│
    │  - help_offers │
    │  - POIs        │
    │  - shelters    │
    │  - campaigns   │
    └────────────────┘
```

---

## Flujo del Motor de Inteligencia

```
Cada 5 minutos:
         │
         ▼
    loadIntelligence()
         │
    Consulta 7 tablas en paralelo:
    ├── help_requests (24h)
    ├── help_offers (24h)
    ├── health_requests (24h)
    ├── shelters (activos)
    ├── campaigns (activas)
    ├── help_requests (24h-48h, para trends)
    └── collection_centers (activos)
         │
         ▼
    ┌────────────────────────────────────────────┐
    │                                            │
    │  computeTrends()                           │
    │  Compara counts 24h vs 24h-48h por tipo    │
    │  → trends signal                           │
    │                                            │
    │  generateInsights()                        │
    │  Analiza: sangre, ofertas, refugios,       │
    │  campanas, criticos, tendencias            │
    │  → insights signal                         │
    │                                            │
    │  computeMatching()                         │
    │  Para cada request reciente (12h):         │
    │  Busca offers/shelters/campaigns/centers   │
    │  dentro de 15-30km                         │
    │  → matchSuggestions signal                 │
    │                                            │
    │  computeMission()                          │
    │  Prioridad: sangre > trend > top type      │
    │  → missionOfTheDay signal                  │
    │                                            │
    └────────────────────────────────────────────┘
         │
         ▼
    UI renderiza signals:
    ├── NationalIntelligence.tsx (insights + matches)
    └── MissionOfTheDay.tsx (prioridad del dia)
```

---

## Flujo de Datos Sismicos

```
USGS API
  │
  Endpoint: earthquake.usgs.gov/fdsnws/event/1/query
  Params: format=geojson, 7 dias, centro 8N/66W, radio 800km, mag >= 2.5
  │
  ▼
loadSeismicData()
  │
  Filtro: coordenadas dentro de Venezuela (0.5-16N, -74--59E)
  │
  ▼
seismicEvents signal
  │
  ▼
Consumed by:
  ├── SeismicTicker.tsx  → ticker horizontal en Home
  └── national-feed.ts  → items en el feed nacional
```

---

## Flujo Offline

```
Sin conexion:
  │
  Usuario llena formulario → enqueue()
  │
  ▼
IndexedDB (offlineQueue)
  table_name, payload, status='pending', retry_count=0
  offline_id = UUID unico
  │
  ▼
OfflineBanner muestra: "Sin conexion. X pendientes."
  │
  ...conexion restaurada...
  │
  ▼
useOnlineStatus detecta 'online'
  │
  ▼
processQueue()
  │
  Para cada item pendiente:
  ├── INSERT en Supabase
  ├── Si error 23505 (duplicado) → marcar como 'synced'
  ├── Si error otro → incrementar retry_count, guardar last_error
  └── Si exito → eliminar de IndexedDB
  │
  ▼
triggerMapRefresh() → mapVersion++
  │
  ▼
Mapa y stores se actualizan
```

---

## Frecuencias de Actualizacion

| Store | Frecuencia | Trigger |
|-------|-----------|---------|
| `liveStats` | 30 segundos | setInterval en Home |
| `nationalFeed` | 45 segundos | setInterval en NationalFeed |
| `intelligence` | 5 minutos | setInterval en NationalIntelligence |
| `coordination` | Manual | Cuando usuario da permiso GPS |
| `seismic` | Manual | Boton en SeismicTicker |
| `campaigns` | Al navegar | loadCampaigns() en pagina |
| `priorities` | Al navegar | loadPriorities() en componente |
| `offlineQueue` | 15 segundos | processQueue() monitor |
