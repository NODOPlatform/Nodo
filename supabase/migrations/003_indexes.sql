CREATE INDEX idx_help_requests_emergency ON help_requests (emergency_id, status);
CREATE INDEX idx_help_requests_city ON help_requests (city);
CREATE INDEX idx_help_requests_urgency ON help_requests (urgency);
CREATE INDEX idx_help_requests_offline ON help_requests (offline_id) WHERE offline_id IS NOT NULL;

CREATE INDEX idx_help_offers_emergency ON help_offers (emergency_id, status);
CREATE INDEX idx_help_offers_offline ON help_offers (offline_id) WHERE offline_id IS NOT NULL;

CREATE INDEX idx_persons_emergency ON persons (emergency_id);
CREATE INDEX idx_persons_name ON persons (emergency_id, lower(first_name), lower(last_name));
CREATE INDEX idx_persons_status ON persons (current_status);
CREATE INDEX idx_persons_offline ON persons (offline_id) WHERE offline_id IS NOT NULL;

CREATE INDEX idx_person_history ON person_status_history (person_id, created_at DESC);

CREATE INDEX idx_shelters_emergency ON shelters (emergency_id, status);
CREATE INDEX idx_shelters_offline ON shelters (offline_id) WHERE offline_id IS NOT NULL;

CREATE INDEX idx_verified_info_emergency ON verified_info (emergency_id, category, is_active);

CREATE INDEX idx_poi_emergency ON points_of_interest (emergency_id, poi_type, is_active);
CREATE INDEX idx_poi_offline ON points_of_interest (offline_id) WHERE offline_id IS NOT NULL;
