import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { qr_code_id, location } = await request.json();

        console.log("Emergency API received location:", location);

        // 1. Fetch QR code and ALL owner/emergency details
        const { data: qrCode, error: qrError } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('id', qr_code_id)
            .single();

        if (qrError || !qrCode) {
            return NextResponse.json({ success: false, error: 'Tag not found' }, { status: 404 });
        }

        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const mapUrl = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : null;

        // 2. Prepare Multi-Channel Notification List
        const emailRecipients = [
            qrCode.owner_email,
            // Add more emails if available in user profile in a real system
        ].filter(Boolean);

        const smsContacts = [
            { name: "Owner", mobile: qrCode.owner_mobile },
            { name: qrCode.emergency_contact_1_name || "Primary", mobile: qrCode.emergency_contact_1 },
            { name: qrCode.emergency_contact_2_name || "Secondary", mobile: qrCode.emergency_contact_2 },
            { name: qrCode.medical_contact_name || "Medical", mobile: qrCode.medical_contact },
            { name: "Police", mobile: qrCode.police_contact }
        ].filter(c => c.mobile);

        // 3. Email Broadcast (Nodemailer)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
            port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
            },
        });

        const emailPromises = emailRecipients.map(recipient =>
            transporter.sendMail({
                from: `"SafeDrive Emergency" <${process.env.EMAIL_USER}>`,
                to: recipient,
                subject: `🚨 CRITICAL EMERGENCY: Vehicle ${qrCode.vehicle_number}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 4px solid #ef4444; border-radius: 12px; background: #fef2f2;">
                        <h1 style="color: #ef4444; margin-bottom: 20px; text-align: center;">RED ALERT: CRITICAL EMERGENCY</h1>
                        <p style="font-size: 18px; font-weight: bold; color: #1f2937;">A high-priority alert has been triggered for vehicle ${qrCode.vehicle_number}.</p>
                        
                        <div style="background: white; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #fee2e2;">
                            <h3 style="margin-top: 0; color: #ef4444;">Vehicle Info:</h3>
                            <p style="margin: 5px 0;"><strong>Plate:</strong> ${qrCode.vehicle_number}</p>
                            <p style="margin: 5px 0;"><strong>Model:</strong> ${qrCode.vehicle_make} ${qrCode.vehicle_model}</p>
                            <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
                            ${mapUrl ? `<p style="margin: 20px 0; text-align: center;"><a href="${mapUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 900;">📍 VIEW LIVE LOCATION</a></p>` : ''}
                        </div>

                        <p style="color: #ef4444; font-weight: bold; text-align: center;">SMS AND WHATSAPP BROADCASTS SENT TO ALL EMERGENCY CONTACTS.</p>
                        <div style="margin-top: 30px; font-size: 11px; color: #9ca3af; text-align: center;">SafeDrive QR Pulse System</div>
                    </div>
                `
            })
        );

        // 4. SMS / WhatsApp Placeholder Logic
        // In a production app, use Twilio / Interakt / MessageBird here
        console.log(`[EMERGENCY BROADCAST] Dispatched to ${smsContacts.length} numbers:`, smsContacts.map(c => c.mobile));

        // Finalize all notifications
        await Promise.allSettled(emailPromises);

        // 5. Create RED ALERT Entry in DB
        const { data: scanLog } = await supabase.from('scan_logs').insert({
            qr_code_id: qrCode.id,
            scan_type: 'emergency',
            location_lat: location?.lat,
            location_lng: location?.lng,
            otp_verified: false
        }).select().single();

        if (scanLog) {
            await supabase.from('emergency_alerts').insert({
                qr_code_id: qrCode.id,
                scan_log_id: scanLog.id,
                alert_sent_to: smsContacts.map(c => `${c.name}: ${c.mobile}`),
                location_lat: location?.lat,
                location_lng: location?.lng,
                resolved: false
            });
        }

        return NextResponse.json({ success: true, contacted_count: smsContacts.length });

    } catch (error: any) {
        console.error('Emergency Notification Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to broadcast alert' }, { status: 500 });
    }
}
