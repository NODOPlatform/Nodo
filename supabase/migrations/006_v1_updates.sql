-- V1.1: Allow anon users to update status fields
CREATE POLICY "help_requests_update" ON help_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "help_offers_update" ON help_offers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "persons_update" ON persons FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "shelters_update" ON shelters FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "poi_update" ON points_of_interest FOR UPDATE TO anon USING (true) WITH CHECK (true);
