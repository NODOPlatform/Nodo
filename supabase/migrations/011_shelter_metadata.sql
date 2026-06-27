-- Add metadata JSONB to shelters for photos and extensible data
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
