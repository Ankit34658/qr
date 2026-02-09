import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { qr_code_id, scan_type, scanner_ip, location } = await request.json();

        const { data: log, error } = await supabase
            .from('scan_logs')
            .insert([
                {
                    qr_code_id: qr_code_id,
                    scan_type,
                    scanner_ip,
                    location_lat: location?.lat,
                    location_lng: location?.lng,
                    otp_verified: scan_type === 'emergency' ? true : false
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, log_id: log.id });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
