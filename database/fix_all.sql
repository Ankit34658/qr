-- Consolidated Fix Script for Vehicle QR System

-- 1. Ensure Columns Exist
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS medical_contact TEXT,
ADD COLUMN IF NOT EXISTS medical_contact_name TEXT,
ADD COLUMN IF NOT EXISTS police_contact TEXT,
ADD COLUMN IF NOT EXISTS police_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_2 TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_2_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'car',
ADD COLUMN IF NOT EXISTS vehicle_color TEXT,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- 2. Fix Contact Tokens Permissions
ALTER TABLE contact_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert contact_tokens" ON contact_tokens;
CREATE POLICY "Allow public insert contact_tokens"
ON contact_tokens FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read contact_tokens" ON contact_tokens;
CREATE POLICY "Allow public read contact_tokens"
ON contact_tokens FOR SELECT
TO public
USING (true);

-- 3. Fix OTP Verifications Permissions (Just in case)
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert otp" ON otp_verifications;
CREATE POLICY "Allow public insert otp"
ON otp_verifications FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update otp" ON otp_verifications;
CREATE POLICY "Allow public update otp"
ON otp_verifications FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read otp" ON otp_verifications;
CREATE POLICY "Allow public read otp"
ON otp_verifications FOR SELECT
TO public
USING (true);

-- 4. Fix Scan Logs Permissions
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert scan_logs" ON scan_logs;
CREATE POLICY "Allow public insert scan_logs"
ON scan_logs FOR INSERT
TO public
WITH CHECK (true);

-- 5. Fix Emergency Alerts Permissions
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert emergency_alerts" ON emergency_alerts;
CREATE POLICY "Allow public insert emergency_alerts"
ON emergency_alerts FOR INSERT
TO public
WITH CHECK (true);

