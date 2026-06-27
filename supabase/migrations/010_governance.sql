-- ============================================================
-- NODO Governance 1.0
-- Roles, permisos, auditoria, sesiones
-- ============================================================

-- Drop existing user_roles constraints to evolve the table
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- Expand role check to include new roles
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('owner', 'super_admin', 'admin', 'moderator', 'editor', 'collaborator'));

-- ============================================================
-- Audit Log
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      TEXT,
  user_name    TEXT,
  user_role    TEXT,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  old_state    JSONB,
  new_state    JSONB,
  metadata     JSONB DEFAULT '{}',
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT TO anon USING (true);
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- Active Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS active_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      TEXT NOT NULL,
  user_name    TEXT,
  device_info  TEXT,
  browser      TEXT,
  os           TEXT,
  ip_address   TEXT,
  is_current   BOOLEAN DEFAULT FALSE,
  last_active  TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON active_sessions (expires_at);

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_read" ON active_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "sessions_insert" ON active_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "sessions_update" ON active_sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "sessions_delete" ON active_sessions FOR DELETE TO anon USING (true);

-- ============================================================
-- Governance Config (emergency mode, backup settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS governance_config (
  key          TEXT PRIMARY KEY,
  value        JSONB NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_by   TEXT
);

ALTER TABLE governance_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov_config_read" ON governance_config FOR SELECT TO anon USING (true);
CREATE POLICY "gov_config_insert" ON governance_config FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "gov_config_update" ON governance_config FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- RLS for user_roles writes
-- ============================================================
CREATE POLICY IF NOT EXISTS "user_roles_insert" ON user_roles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "user_roles_update" ON user_roles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "user_roles_delete" ON user_roles FOR DELETE TO anon USING (true);

-- ============================================================
-- Seed: Default owner
-- ============================================================
INSERT INTO user_roles (email, role, display_name, permissions, created_by)
VALUES ('owner@nodoayuda.com', 'owner', 'Propietario NODO', ARRAY[
  'manage_users','manage_roles','manage_campaigns','manage_shelters',
  'manage_collection_centers','manage_health','manage_incidents',
  'manage_verified_info','manage_statistics','manage_settings',
  'manage_integrations','view_audit_log','restore_backups'
], 'system')
ON CONFLICT (email) DO UPDATE SET role = 'owner', permissions = EXCLUDED.permissions;

-- Seed: Emergency mode default
INSERT INTO governance_config (key, value, updated_by)
VALUES ('emergency_mode', '{"active": false, "activated_by": null, "activated_at": null}'::jsonb, 'system')
ON CONFLICT (key) DO NOTHING;

-- Seed: Backup config
INSERT INTO governance_config (key, value, updated_by)
VALUES ('backup_config', '{"auto_daily": false, "last_backup": null, "retention_days": 30}'::jsonb, 'system')
ON CONFLICT (key) DO NOTHING;
