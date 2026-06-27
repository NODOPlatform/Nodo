-- ============================================================
-- Columnas adicionales para refugios
-- ============================================================
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS state_name TEXT;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS responsible TEXT;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS accepts_pets BOOLEAN DEFAULT FALSE;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS accepts_children BOOLEAN DEFAULT TRUE;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS accepts_elderly BOOLEAN DEFAULT TRUE;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS accepts_disabled BOOLEAN DEFAULT TRUE;

-- ============================================================
-- RLS: permitir UPDATE y DELETE para administracion
-- ============================================================
CREATE POLICY "shelters_update" ON shelters FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "shelters_delete" ON shelters FOR DELETE TO anon USING (true);

-- ============================================================
-- Estructura de roles (preparada para futuro)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'collaborator'
                CHECK (role IN ('admin', 'moderator', 'collaborator')),
  display_name  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read" ON user_roles FOR SELECT TO anon USING (true);
