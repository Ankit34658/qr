export type VehicleType = 'car' | 'bike' | 'truck' | 'bus' | 'other';
export type QRStatus = 'active' | 'paused' | 'deleted';
export type ScanType = 'normal' | 'emergency';
export type ContactMethod = 'call' | 'whatsapp' | 'both' | 'none';

export interface User {
    id: string;
    email: string;
    full_name: string;
    mobile_primary?: string;
    role: 'admin' | 'owner';
    created_at: string;
}

export interface QRCode {
    id: string;
    qr_unique_id: string;
    user_id: string;

    // Activation Status
    is_activated: boolean;

    // Vehicle Information (Optional until activated)
    vehicle_number?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_color?: string;
    vehicle_type?: VehicleType;

    // Owner Information (Optional until activated)
    owner_name?: string;
    owner_mobile?: string;
    owner_whatsapp?: string;
    owner_email?: string;

    // Tiered Emergency Contacts
    emergency_contacts?: {
        friend?: { name: string; mobile: string; whatsapp?: string };
        office?: { name: string; mobile: string; whatsapp?: string };
        family?: { name: string; mobile: string; whatsapp?: string };
    };

    // Legacy single fields for backward compatibility or individual overrides
    emergency_contact_1?: string;
    emergency_contact_1_name?: string;
    emergency_contact_2?: string;
    emergency_contact_2_name?: string;
    medical_contact?: string;
    medical_contact_name?: string;
    police_contact?: string;
    police_contact_name?: string;

    // Extra details (Society/Normal)
    details_type: 'normal' | 'society';
    details_data?: {
        society_name?: string;
        flat_number?: string;
        wing?: string;
        parking_slot?: string;
        additional_info?: string;
    };

    call_enabled: boolean;
    whatsapp_enabled: boolean;
    emergency_enabled: boolean;
    show_owner_name: boolean;
    require_otp: boolean;
    status: QRStatus;
    qr_image_url?: string;
    scan_url?: string;
    location_address?: string;
    created_at: string;
}

export interface ScanLog {
    id: string;
    qr_code_id: string;
    scan_type: ScanType;
    scanner_identifier?: string;
    scanner_ip?: string;
    scanner_user_agent?: string;
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    contact_method?: ContactMethod;
    otp_verified: boolean;
    message_content?: string;
    created_at: string;
}
