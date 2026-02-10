-- Fix vehicle_type constraint to allow 'scooty' and 'auto'
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_vehicle_type_check;

ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_vehicle_type_check 
CHECK (vehicle_type IN ('car', 'bike', 'truck', 'bus', 'other', 'scooty', 'auto'));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
