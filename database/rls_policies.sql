-- Row Level Security Policies for Vehicle QR Safety System
-- Run this AFTER running schema.sql

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Allow anyone to insert new users (for registration)
CREATE POLICY "Allow public user registration"
ON users FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO public
USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- QR_CODES TABLE POLICIES
-- ============================================

-- Allow authenticated users to insert QR codes
CREATE POLICY "Allow authenticated insert qr_codes"
ON qr_codes FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read QR codes (needed for public scan page)
CREATE POLICY "Allow public read qr_codes"
ON qr_codes FOR SELECT
TO public
USING (true);

-- Allow users to update their own QR codes
CREATE POLICY "Allow update own qr_codes"
ON qr_codes FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow users to delete their own QR codes
CREATE POLICY "Allow delete own qr_codes"
ON qr_codes FOR DELETE
TO public
USING (true);

-- ============================================
-- SCAN_LOGS TABLE POLICIES
-- ============================================

-- Allow anyone to insert scan logs (public scanning)
CREATE POLICY "Allow public insert scan_logs"
ON scan_logs FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read scan logs
CREATE POLICY "Allow public read scan_logs"
ON scan_logs FOR SELECT
TO public
USING (true);

-- ============================================
-- OTP_VERIFICATIONS TABLE POLICIES
-- ============================================

-- Allow anyone to insert OTP verifications
CREATE POLICY "Allow public insert otp"
ON otp_verifications FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read OTP verifications
CREATE POLICY "Allow public read otp"
ON otp_verifications FOR SELECT
TO public
USING (true);

-- Allow anyone to update OTP verifications
CREATE POLICY "Allow public update otp"
ON otp_verifications FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- EMERGENCY_ALERTS TABLE POLICIES
-- ============================================

-- Allow anyone to insert emergency alerts
CREATE POLICY "Allow public insert emergency_alerts"
ON emergency_alerts FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read emergency alerts
CREATE POLICY "Allow public read emergency_alerts"
ON emergency_alerts FOR SELECT
TO public
USING (true);

-- Allow anyone to update emergency alerts
CREATE POLICY "Allow public update emergency_alerts"
ON emergency_alerts FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- APP_SETTINGS TABLE POLICIES
-- ============================================

-- Allow authenticated users to insert settings
CREATE POLICY "Allow insert app_settings"
ON app_settings FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to read their own settings
CREATE POLICY "Allow read app_settings"
ON app_settings FOR SELECT
TO public
USING (true);

-- Allow users to update their own settings
CREATE POLICY "Allow update app_settings"
ON app_settings FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
