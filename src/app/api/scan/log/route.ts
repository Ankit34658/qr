import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { qr_code_id, scan_type, scanner_ip, location } = await request.json();

        // Validate required fields
        if (!qr_code_id) {
            return NextResponse.json({ success: false, error: "Missing qr_code_id" }, { status: 400 });
        }

        const { data: log, error } = await supabase
            .from('scan_logs')
            .insert([
                {
                    qr_code_id: qr_code_id,
                    scan_type: scan_type || 'normal',
                    scanner_ip: scanner_ip || null,
                    location_lat: location?.lat || null,
                    location_lng: location?.lng || null,
                    otp_verified: scan_type === 'emergency' ? true : false
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        return NextResponse.json({ success: true, log_id: log.id });
    } catch (error: any) {
        console.error("Scan Log API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
