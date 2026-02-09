-- Add message_content column to scan_logs table
ALTER TABLE scan_logs 
ADD COLUMN IF NOT EXISTS message_content TEXT;

-- Verify the column is added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scan_logs' AND column_name = 'message_content';
