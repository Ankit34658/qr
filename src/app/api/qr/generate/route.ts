import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            quantity = 1,
            user_id
        } = body;

        // Fetch the current total count to determine the starting sequential ID
        const { count: initialCount } = await supabase
            .from('qr_codes')
            .select('*', { count: 'exact', head: true });

        const nextStartNumber = (initialCount || 0) + 1;
        const generatedCodes = [];

        for (let i = 0; i < quantity; i++) {
            const nextNumber = nextStartNumber + i;
            const qr_unique_id = nextNumber.toString().padStart(2, '0');

            // Use nfctool.com style if configured, otherwise fallback to root route
            const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://nfctool.com').replace(/\/$/, '');
            const scan_url = `${appUrl}/${qr_unique_id}`;

            // Generate QR Data URL
            const qr_image_url = await QRCode.toDataURL(scan_url, {
                margin: 2,
                width: 512,
                color: {
                    dark: '#1e40af', // Blue 800
                    light: '#ffffff'
                }
            });

            const qrData = {
                qr_unique_id,
                scan_url,
                qr_image_url,
                status: 'paused', // Initially paused until activated
                is_activated: false,
                user_id: user_id || null,
                // Default settings
                call_enabled: true,
                whatsapp_enabled: true,
                emergency_enabled: true,
                show_owner_name: false,
                require_otp: false, // User requested removing OTP
            };

            const { data, error } = await supabase
                .from('qr_codes')
                .insert([qrData])
                .select()
                .single();

            if (error) throw error;
            generatedCodes.push(data);
        }

        return NextResponse.json({
            success: true,
            message: `${quantity} QR code(s) generated successfully`,
            qr_codes: generatedCodes
        });
    } catch (error: any) {
        console.error("QR Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
