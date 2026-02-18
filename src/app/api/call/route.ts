import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { qr_id, scanner_mobile, target_mobile } = await req.json();

        if (!qr_id || !scanner_mobile) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: qr_id or scanner_mobile.' },
                { status: 400 }
            );
        }

        // 1. Determine Target Mobile (Owner or Specific Target)
        let finalTargetMobile = target_mobile;

        if (!finalTargetMobile) {
            // Fetch QR Code details (Owner Mobile) if no target specified
            const { data: qrCode, error: qrError } = await supabase
                .from('qr_codes')
                .select('owner_mobile')
                .eq('id', qr_id)
                .single();

            if (qrError || !qrCode) {
                console.error('QR Fetch Error:', qrError);
                return NextResponse.json(
                    { success: false, error: 'Invalid QR Code or Owner not found.' },
                    { status: 404 }
                );
            }
            finalTargetMobile = qrCode.owner_mobile;
        }

        if (!finalTargetMobile) {
            return NextResponse.json(
                { success: false, error: 'Target mobile number not found.' },
                { status: 404 }
            );
        }

        const appId = process.env.TELECMI_APP_ID;
        const appSecret = process.env.TELECMI_APP_SECRET;
        const virtualNumber = process.env.TELECMI_VIRTUAL_NUMBER; // The mask number

        if (!appId || !appSecret || !virtualNumber) {
            return NextResponse.json(
                { success: false, error: 'Call service configuration error.' },
                { status: 500 }
            );
        }

        // Format numbers to remove non-digit characters and standardise
        const formatNumber = (num: string) => {
            const cleaned = num.replace(/\D/g, '');
            // Ensure country code 91 for India if not present, or handle accordingly.
            // PIOPIY likely expects 91 prefix for India.
            if (cleaned.length === 10) return `91${cleaned}`;
            if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned;
            return cleaned; // Fallback
        };

        const formattedScanner = formatNumber(scanner_mobile);
        const formattedOwner = formatNumber(finalTargetMobile);
        const formattedVirtual = formatNumber(virtualNumber);

        // 2. TeleCMI API Payload
        // We want to bridge call: Virtual Number -> Scanner -> (Bridge) -> Owner
        // Flow:
        // - Call Scanner (Caller ID: Virtual Number)
        // - Scanner Answers
        // - Bridge to Owner (Caller ID: Virtual Number)

        const payload = {
            appid: Number(appId),
            secret: appSecret,
            from: Number(formattedVirtual), // Caller ID shown to Scanner
            to: Number(formattedScanner),   // First leg: Call Scanner
            pcmo: [
                {
                    action: "bridge",
                    from: Number(formattedVirtual), // Caller ID shown to Owner
                    duration: 900, // 15 mins max duration
                    timeout: 20,   // Ring timeout
                    loop: 1,
                    connect: [
                        {
                            type: "pstn",
                            number: Number(formattedOwner) // Second leg: Connect to Owner
                        }
                    ]
                }
            ]
        };

        console.log('Initiating Call:', {
            scanner: formattedScanner,
            owner: '*****' + formattedOwner.slice(-4),
            virtual: formattedVirtual
        });

        const response = await fetch('https://rest.telecmi.com/v2/ind_pcmo_make_call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.code !== 200) {
            console.error('TeleCMI Error:', data);
            return NextResponse.json(
                { success: false, error: data.message || 'Failed to initiate call.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Call initiated successfully. You will receive a call shortly.',
            data: data
        });

    } catch (error: any) {
        console.error('Call API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
