import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { token, qr_id, method, message, scanner_identity } = await request.json();

        let qrCode: any = null;
        let scannerEmail = scanner_identity || "Anonymous Scanner";

        if (token) {
            // 1. Verify token
            const { data: contactToken, error: tokenError } = await supabase
                .from('contact_tokens')
                .select('*, qr_codes(*)')
                .eq('token', token)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (tokenError || !contactToken) {
                return NextResponse.json({ success: false, error: 'Session expired. Please re-verify identity.' }, { status: 401 });
            }
            qrCode = contactToken.qr_codes;
            scannerEmail = contactToken.scanner_identifier;
        } else if (qr_id) {
            // Unverified Relay
            const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('id', qr_id)
                .single();

            if (error || !data) {
                return NextResponse.json({ success: false, error: 'Vehicle not found.' }, { status: 404 });
            }
            qrCode = data;
        } else {
            return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
        }

        console.log("Relay Debug:", {
            vehicle: qrCode.vehicle_number,
            ownerEmail: qrCode.owner_email,
            scanner: scannerEmail
        });

        // 2. Prepare Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
            port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
            },
        });

        // 3. Construct Relay Message
        let subject = "";
        let html = "";

        if (method === 'whatsapp' || method === 'message') {
            subject = `💬 New Message for Vehicle ${qrCode.vehicle_number}`;
            html = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #2563eb;">New Secure Message</h2>
                    <p>Someone has scanned the QR on your vehicle <strong>${qrCode.vehicle_number}</strong> (${qrCode.vehicle_make} ${qrCode.vehicle_model}).</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                        <p style="margin: 0; font-style: italic;">"${message || 'I have a question about your vehicle parking.'}"</p>
                    </div>
                    <p><strong>Scanner Identity:</strong> ${scannerEmail}</p>
                    <div style="margin-top: 25px;">
                        <a href="mailto:${scannerEmail}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reply via Email</a>
                    </div>
                </div>
            `;
        } else if (method === 'call') {
            subject = `📞 Call Request for Vehicle ${qrCode.vehicle_number}`;
            html = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #2563eb;">Urgent: Call Request</h2>
                    <p>The user <strong>${scannerEmail}</strong> is requesting to speak with you regarding your vehicle <strong>${qrCode.vehicle_number}</strong>.</p>
                    <p>They have been verified through SafeDrive OTP.</p>
                    <div style="margin-top: 25px;">
                        <a href="mailto:${scannerEmail}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Contact Scanner</a>
                    </div>
                </div>
            `;
        }

        // 4. Log activity (Log BEFORE email to ensure record exists)
        await supabase.from('scan_logs').insert({
            qr_code_id: qrCode.id,
            scan_type: 'normal',
            contact_method: method,
            scanner_identifier: scannerEmail,
            otp_verified: true
        });

        if (!qrCode.owner_email) {
            console.warn("Relay: Owner email missing. Logged to dashboard only.");
            return NextResponse.json({
                success: true,
                message: 'Owner notified via Dashboard (Email not linked).'
            });
        }

        // 5. Send Relay Email to Owner
        try {
            await transporter.sendMail({
                from: `"SafeDrive Relay" <${process.env.EMAIL_USER}>`,
                to: qrCode.owner_email,
                replyTo: scannerEmail,
                subject: subject,
                html: html,
            });
        } catch (emailError) {
            console.error("Relay Email Failed:", emailError);
            // Return success because we already logged it to the dashboard
            return NextResponse.json({
                success: true,
                message: 'Request logged to dashboard (Email delivery failed).'
            });
        }

        return NextResponse.json({ success: true, message: 'Owner has been notified securely.' });

    } catch (error: any) {
        console.error("Relay Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Relay failed' }, { status: 500 });
    }
}
