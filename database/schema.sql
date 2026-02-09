-- Create all required tables with proper relationships

-- Users table for admin accounts
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Codes main table
CREATE TABLE qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_unique_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Vehicle Information
  vehicle_number TEXT NOT NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('car', 'bike', 'truck', 'bus', 'other')),
  
  -- Owner Information
  owner_name TEXT NOT NULL,
  owner_mobile TEXT NOT NULL,
  owner_email TEXT,
  emergency_contact_1 TEXT,
  emergency_contact_1_name TEXT,
  emergency_contact_2 TEXT,
  emergency_contact_2_name TEXT,
  medical_contact TEXT,
  medical_contact_name TEXT,
  police_contact TEXT,
  police_contact_name TEXT,
  
  -- Privacy Settings
  call_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  emergency_enabled BOOLEAN DEFAULT true,
  show_owner_name BOOLEAN DEFAULT false,
  require_otp BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  qr_image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan logs for tracking
CREATE TABLE scan_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  scan_type TEXT CHECK (scan_type IN ('normal', 'emergency')),
  scanner_identifier TEXT,
  scanner_ip TEXT,
  scanner_user_agent TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  contact_method TEXT CHECK (contact_method IN ('call', 'whatsapp', 'both', 'none')),
  otp_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP verifications
CREATE TABLE otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT false,
  attempts INT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency alerts
CREATE TABLE emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  scan_log_id UUID REFERENCES scan_logs(id) ON DELETE CASCADE,
  alert_sent_to TEXT[],
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Temporary contact tokens for identity masking
CREATE TABLE contact_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  scanner_identifier TEXT NOT NULL, -- e.g. email/mobile of scanner
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_qr_codes_unique_id ON qr_codes(qr_unique_id);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_scan_logs_qr_code_id ON scan_logs(qr_code_id);
CREATE INDEX idx_scan_logs_created_at ON scan_logs(created_at DESC);
CREATE INDEX idx_otp_verifications_identifier ON otp_verifications(identifier);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
