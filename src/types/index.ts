export interface QRCode {
    id: string;
    qr_unique_id: string;
    user_id?: string | null;
    vehicle_number?: string | null;
    vehicle_type?: 'car' | 'bike' | 'scooty' | 'truck' | 'auto' | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_color?: string | null;
    owner_name?: string | null;
    owner_mobile?: string | null;
    owner_whatsapp?: string | null;
    insurance_pdf_url?: string | null;
    emergency_contacts?: {
        family?: { name: string; mobile: string; whatsapp: string };
        friend?: { name: string; mobile: string; whatsapp: string };
        office?: { name: string; mobile: string; whatsapp: string };
    } | null;
    details_type?: 'normal' | 'society' | null;
    details_data?: any | null;
    status?: 'active' | 'paused' | 'inactive' | null;
    is_activated: boolean;
    scan_url?: string | null;
    qr_image_url?: string | null;
    call_enabled?: boolean;
    whatsapp_enabled?: boolean;
    emergency_enabled?: boolean;
    show_owner_name?: boolean;
    require_otp?: boolean;
    created_at: string;
    updated_at: string;
}

export interface ScanLog {
    id: string;
    created_at: string;
    qr_code_id: string;
    scan_type: 'normal' | 'emergency';
    scanner_ip?: string | null;
    scanner_identifier?: string | null;
    otp_verified?: boolean;
    location_lat?: number | null;
    location_lng?: number | null;
    qr_codes?: Partial<QRCode>;
}

export interface User {
    id: string;
    full_name: string;
    email: string;
    mobile_primary?: string;
    role?: string;
    created_at?: string;
}
