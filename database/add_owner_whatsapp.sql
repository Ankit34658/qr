-- Add owner_whatsapp column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'owner_whatsapp') THEN 
        ALTER TABLE qr_codes ADD COLUMN owner_whatsapp TEXT; 
    END IF; 
END $$;

-- Force schema cache reload to fix "Could not find column in schema cache" error
NOTIFY pgrst, 'reload schema';
