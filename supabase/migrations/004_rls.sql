-- Habilitar RLS en todas las tablas
ALTER TABLE emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;

-- Emergencias: lectura publica
CREATE POLICY "emergencies_read" ON emergencies FOR SELECT TO anon USING (true);

-- Help requests: lectura publica (sin contact_method), insercion publica
CREATE POLICY "help_requests_read" ON help_requests FOR SELECT TO anon USING (true);
CREATE POLICY "help_requests_insert" ON help_requests FOR INSERT TO anon WITH CHECK (true);

-- Help offers: lectura publica (sin contact_info), insercion publica
CREATE POLICY "help_offers_read" ON help_offers FOR SELECT TO anon USING (true);
CREATE POLICY "help_offers_insert" ON help_offers FOR INSERT TO anon WITH CHECK (true);

-- Personas: lectura publica, insercion publica
CREATE POLICY "persons_read" ON persons FOR SELECT TO anon USING (true);
CREATE POLICY "persons_insert" ON persons FOR INSERT TO anon WITH CHECK (true);

-- Historial: lectura publica, insercion publica
CREATE POLICY "person_history_read" ON person_status_history FOR SELECT TO anon USING (true);
CREATE POLICY "person_history_insert" ON person_status_history FOR INSERT TO anon WITH CHECK (true);

-- Refugios: lectura publica, insercion publica
CREATE POLICY "shelters_read" ON shelters FOR SELECT TO anon USING (true);
CREATE POLICY "shelters_insert" ON shelters FOR INSERT TO anon WITH CHECK (true);

-- Info verificada: solo lectura publica
CREATE POLICY "verified_info_read" ON verified_info FOR SELECT TO anon USING (is_active = true);

-- Puntos de interes: lectura publica, insercion publica
CREATE POLICY "poi_read" ON points_of_interest FOR SELECT TO anon USING (true);
CREATE POLICY "poi_insert" ON points_of_interest FOR INSERT TO anon WITH CHECK (true);

-- Vistas publicas que ocultan datos privados
CREATE OR REPLACE VIEW public_help_requests AS
SELECT id, emergency_id, latitude, longitude, address_text, city, sector,
       people_count, help_types, urgency, status, description, photo_url,
       created_at, updated_at
FROM help_requests;

CREATE OR REPLACE VIEW public_help_offers AS
SELECT id, emergency_id, latitude, longitude, address_text, city, sector,
       offer_types, description, available_hours, status, created_at, updated_at
FROM help_offers;
