-- Add metadata JSONB to tables that don't have it yet
ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE help_offers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE verified_info ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
