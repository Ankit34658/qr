-- Add insurance_pdf_url column to qr_codes table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'insurance_pdf_url') THEN 
        ALTER TABLE qr_codes ADD COLUMN insurance_pdf_url TEXT; 
    END IF; 
END $$;

-- Enable public access to insurance-documents bucket (run this in Supabase SQL Editor if needed)
-- Note: Storage buckets themselves must be created via the Supabase dashboard or API.
-- This script only handles the table column.

NOTIFY pgrst, 'reload schema';
