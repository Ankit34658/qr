import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            qr_id,
            vehicle_number,
            vehicle_type,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            owner_name,
            owner_mobile,
            owner_whatsapp,
            emergency_contacts,
            details_type,
            details_data,
            insurance_pdf_url
        } = body;

        if (!qr_id || !owner_name || !owner_mobile) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('qr_codes')
            .update({
                vehicle_number,
                vehicle_type: vehicle_type?.toLowerCase() || 'car',
                vehicle_make,
                vehicle_model,
                vehicle_color,
                owner_name,
                owner_mobile,
                owner_whatsapp,
                emergency_contacts,
                details_type: details_type || 'normal',
                details_data,
                insurance_pdf_url,
                is_activated: true,
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', qr_id)
            .select()
            .single();

        if (error) throw error;

        // ✅ Also log this activation as a scan event
        await supabase.from('scan_logs').insert({
            qr_code_id: qr_id,
            scan_type: 'normal',
            scanner_ip: null,
            location_lat: null,
            location_lng: null,
            otp_verified: false
        });

        return NextResponse.json({ success: true, qr_code: data });
    } catch (error: any) {
        console.error("QR Activation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
