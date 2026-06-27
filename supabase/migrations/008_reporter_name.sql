-- Add reporter_name to help tables
ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS reporter_name TEXT;
ALTER TABLE help_offers ADD COLUMN IF NOT EXISTS reporter_name TEXT;

-- points_of_interest uses metadata JSONB for reporter_name, no column change needed
-- persons already have first_name / last_name
