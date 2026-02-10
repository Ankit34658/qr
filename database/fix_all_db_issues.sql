-- FINAL DATABASE FIX FOR INSURANCE AND VEHICLE TYPES
-- 1. Ensure insurance column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'insurance_pdf_url') THEN 
        ALTER TABLE qr_codes ADD COLUMN insurance_pdf_url TEXT; 
    END IF; 
END $$;

-- 2. Expand vehicle type constraint to allow all frontend options
-- We first remove the old constraint and add a new one with 'scooty' and 'auto'
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_vehicle_type_check;

ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_vehicle_type_check 
CHECK (vehicle_type IN ('car', 'bike', 'truck', 'bus', 'other', 'scooty', 'auto'));

-- 3. Force schema cache reload
NOTIFY pgrst, 'reload schema';
