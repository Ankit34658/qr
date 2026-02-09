export type VehicleType = 'car' | 'bike' | 'truck' | 'bus' | 'other';
export type QRStatus = 'active' | 'paused' | 'deleted';
export type ScanType = 'normal' | 'emergency';
export type ContactMethod = 'call' | 'whatsapp' | 'both' | 'none';

export interface User {
    id: string;
    email: string;
    name: string;
    mobile?: string;
    role: 'admin';
    created_at: string;
}

export interface QRCode {
    id: string;
    qr_unique_id: string;
    user_id: string;
    vehicle_number: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_color?: string;
    vehicle_type: VehicleType;
    owner_name: string;
    owner_mobile: string;
    owner_email?: string;
    emergency_contact_1?: string;
    emergency_contact_1_name?: string;
    emergency_contact_2?: string;
    emergency_contact_2_name?: string;
    medical_contact?: string;
    medical_contact_name?: string;
    police_contact?: string;
    police_contact_name?: string;
    call_enabled: boolean;
    whatsapp_enabled: boolean;
    emergency_enabled: boolean;
    show_owner_name: boolean;
    require_otp: boolean;
    status: QRStatus;
    qr_image_url?: string;
    created_at: string;
}

export interface ScanLog {
    id: string;
    qr_code_id: string;
    scan_type: ScanType;
    scanner_identifier?: string;
    scanner_ip?: string;
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    contact_method?: ContactMethod;
    otp_verified: boolean;
    created_at: string;
}
