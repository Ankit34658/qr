import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { qr_code_id, location } = await request.json();

        // 1. Fetch QR code and owner details
        const { data: qrCode, error: qrError } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('id', qr_code_id)
            .single();

        if (qrError || !qrCode) {
            return NextResponse.json({ success: false, error: 'Tag not found' }, { status: 404 });
        }

        // 2. Prepare Email Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
            port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
            },
        });

        // 3. Construct Emergency Message
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const locationInfo = location ? `\nLocation: https://www.google.com/maps?q=${location.lat},${location.lng}` : '';

        const mailOptions = {
            from: `"SafeDrive Emergency" <${process.env.EMAIL_USER}>`,
            to: qrCode.owner_email,
            subject: `🚨 CRITICAL EMERGENCY: Vehicle ${qrCode.vehicle_number}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; rounded: 12px;">
                    <h1 style="color: #ef4444; margin-bottom: 20px;">CRITICAL EMERGENCY ALERT</h1>
                    <p style="font-size: 16px; line-height: 1.6;">A high-priority emergency alert has been triggered for your vehicle.</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Vehicle Details:</h3>
                        <p style="margin: 5px 0;"><strong>Number:</strong> ${qrCode.vehicle_number}</p>
                        <p style="margin: 5px 0;"><strong>Model:</strong> ${qrCode.vehicle_make} ${qrCode.vehicle_model}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${timestamp}</p>
                        ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> <a href="https://www.google.com/maps?q=${location.lat},${location.lng}">View on Google Maps</a></p>` : ''}
                    </div>

                    <p style="color: #64748b; font-size: 14px;">If you enabled emergency contacts, we recommend reaching out to them immediately or checking your vehicle status.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                        This is an automated life-safety alert from SafeDrive QR System.
                    </div>
                </div>
            `,
        };

        // 4. Send Email
        await transporter.sendMail(mailOptions);

        // 5. Log the emergency scan (if not already logged by the frontend)
        await supabase.from('scan_logs').insert({
            qr_code_id: qrCode.id,
            scan_type: 'emergency',
            otp_verified: false // Emergency doesn't require OTP
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Emergency Notification Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to send emergency broadcast' }, { status: 500 });
    }
}
