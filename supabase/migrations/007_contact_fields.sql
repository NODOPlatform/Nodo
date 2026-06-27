-- Add contact method fields to main tables
ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS contact_method TEXT;
ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS contact_value TEXT;

ALTER TABLE help_offers ADD COLUMN IF NOT EXISTS contact_method TEXT;
ALTER TABLE help_offers ADD COLUMN IF NOT EXISTS contact_value TEXT;

ALTER TABLE persons ADD COLUMN IF NOT EXISTS contact_method TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS contact_value TEXT;

-- points_of_interest uses metadata JSONB, no column changes needed
