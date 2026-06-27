-- Official campaigns table
CREATE TABLE IF NOT EXISTS official_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES emergencies(id),
  title TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'general',
  organization TEXT,
  start_date DATE,
  end_date DATE,
  opening_hours TEXT,
  image_url TEXT,
  source_url TEXT,
  verification_level TEXT NOT NULL DEFAULT 'unverified',
  status TEXT NOT NULL DEFAULT 'active',
  locations JSONB DEFAULT '[]'::jsonb,
  requirements TEXT[],
  contact_phone TEXT,
  whatsapp TEXT,
  website TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_emergency ON official_campaigns(emergency_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON official_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON official_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON official_campaigns(start_date, end_date);

ALTER TABLE official_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_read" ON official_campaigns FOR SELECT USING (true);
CREATE POLICY "campaigns_insert" ON official_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "campaigns_update" ON official_campaigns FOR UPDATE USING (true);
