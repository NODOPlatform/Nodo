-- ============================================================
-- Emergencias
-- ============================================================
CREATE TABLE emergencies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  country       TEXT NOT NULL DEFAULT 'VE',
  region        TEXT,
  center_lat    DOUBLE PRECISION NOT NULL,
  center_lng    DOUBLE PRECISION NOT NULL,
  default_zoom  INTEGER DEFAULT 12,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Solicitudes de ayuda
-- ============================================================
CREATE TABLE help_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id    UUID REFERENCES emergencies(id),
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  address_text    TEXT,
  city            TEXT,
  sector          TEXT,
  people_count    INTEGER DEFAULT 1,
  help_types      TEXT[] DEFAULT '{}',
  urgency         TEXT NOT NULL DEFAULT 'medium',
  status          TEXT NOT NULL DEFAULT 'pending',
  description     TEXT,
  contact_method  TEXT,
  photo_url       TEXT,
  device_id       TEXT,
  offline_id      TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Ofertas de ayuda
-- ============================================================
CREATE TABLE help_offers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id    UUID REFERENCES emergencies(id),
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  address_text    TEXT,
  city            TEXT,
  sector          TEXT,
  offer_types     TEXT[] DEFAULT '{}',
  description     TEXT,
  available_hours TEXT,
  contact_name    TEXT,
  contact_info    TEXT,
  status          TEXT NOT NULL DEFAULT 'available',
  device_id       TEXT,
  offline_id      TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Personas (buscadas / encontradas)
-- ============================================================
CREATE TABLE persons (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id      UUID REFERENCES emergencies(id),
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  approximate_age   INTEGER,
  description       TEXT,
  photo_url         TEXT,
  current_status    TEXT NOT NULL DEFAULT 'unknown',
  last_known_lat    DOUBLE PRECISION,
  last_known_lng    DOUBLE PRECISION,
  last_known_address TEXT,
  city              TEXT,
  sector            TEXT,
  is_found          BOOLEAN DEFAULT FALSE,
  found_at          TIMESTAMPTZ,
  device_id         TEXT,
  offline_id        TEXT UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Historial de estado de personas
-- ============================================================
CREATE TABLE person_status_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id           UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  status              TEXT NOT NULL,
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  address_text        TEXT,
  notes               TEXT,
  reported_by_device  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Refugios temporales
-- ============================================================
CREATE TABLE shelters (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id      UUID REFERENCES emergencies(id),
  name              TEXT NOT NULL,
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,
  address_text      TEXT,
  city              TEXT,
  sector            TEXT,
  capacity          INTEGER,
  current_occupancy INTEGER DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'active',
  has_water         BOOLEAN DEFAULT FALSE,
  has_food          BOOLEAN DEFAULT FALSE,
  has_electricity   BOOLEAN DEFAULT FALSE,
  has_bathrooms     BOOLEAN DEFAULT FALSE,
  has_internet      BOOLEAN DEFAULT FALSE,
  has_medical       BOOLEAN DEFAULT FALSE,
  has_sleeping_space BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  device_id         TEXT,
  offline_id        TEXT UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Informacion verificada
-- ============================================================
CREATE TABLE verified_info (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id    UUID REFERENCES emergencies(id),
  category        TEXT NOT NULL DEFAULT 'general',
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  source          TEXT,
  is_pinned       BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Puntos de interes
-- ============================================================
CREATE TABLE points_of_interest (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id    UUID REFERENCES emergencies(id),
  poi_type        TEXT NOT NULL,
  name            TEXT NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  address_text    TEXT,
  city            TEXT,
  sector          TEXT,
  description     TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  verified        BOOLEAN DEFAULT FALSE,
  metadata        JSONB DEFAULT '{}',
  device_id       TEXT,
  offline_id      TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
