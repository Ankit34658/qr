-- Add missing columns to qr_codes table if they don't exist
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

-- Verify columns are added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'qr_codes';
