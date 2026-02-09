import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            vehicle_number,
            vehicle_type,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            owner_name,
            owner_mobile,
            emergency_contact_1,
            emergency_contact_1_name,
            call_enabled,
            whatsapp_enabled,
            emergency_enabled,
            show_owner_name,
            require_otp,
            user_id
        } = body;

        const qr_unique_id = nanoid(10);
        // Fallback to localhost if NEXT_PUBLIC_APP_URL is not set
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const scan_url = `${baseUrl}/scan/${qr_unique_id}`;

        // Generate QR Data URL
        const qr_image_url = await QRCode.toDataURL(scan_url, {
            margin: 2,
            width: 512,
            color: {
                dark: '#1e40af', // Blue 800
                light: '#ffffff'
            }
        });

        const { data: qrCode, error } = await supabase
            .from('qr_codes')
            .insert([
                {
                    qr_unique_id,
                    vehicle_number,
                    vehicle_type: vehicle_type?.toLowerCase() || 'car',
                    vehicle_make,
                    vehicle_model,
                    vehicle_color,
                    owner_name,
                    owner_mobile,
                    emergency_contact_1,
                    emergency_contact_1_name,
                    call_enabled,
                    whatsapp_enabled,
                    emergency_enabled,
                    show_owner_name,
                    require_otp,
                    qr_image_url,
                    user_id,
                    status: 'active'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, qr_code: qrCode });
    } catch (error: any) {
        console.error("QR Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
