-- Enable RLS on contact_tokens table
ALTER TABLE contact_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone (server-side anon) to insert tokens (Generated during OTP verification)
CREATE POLICY "Allow public insert contact_tokens"
ON contact_tokens FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone (server-side anon) to read tokens (Used during Relay)
CREATE POLICY "Allow public read contact_tokens"
ON contact_tokens FOR SELECT
TO public
USING (true);

-- Debug: Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'contact_tokens';
