import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { email, qr_id } = await request.json();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in database with expiry
        const { error: dbError } = await supabase
            .from('otp_verifications')
            .insert([
                {
                    identifier: email,
                    otp_code: otp,
                    qr_code_id: qr_id,
                    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
                }
            ]);

        // DEV: Log OTP for local testing if email fails
        console.log("============================================");
        console.log("🔐 DEV DEBUG - OTP CODE:", otp);
        console.log("============================================");

        if (dbError) throw dbError;

        // Send Email
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
            port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587),
            secure: (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: `"SafeDrive System" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Verification Code for Vehicle Contact",
                html: `
            <div style="font-family: sans-serif; padding: 40px; color: #111; background-color: #f9fafb;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #2563eb; margin-top: 0; font-weight: 900;">Identity Verification</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">You are attempting to contact a vehicle owner via SafeDrive QR. Please use the following security code to verify your identity:</p>
                <div style="background: #eff6ff; padding: 30px; border-radius: 20px; font-size: 32px; font-weight: 900; text-align: center; letter-spacing: 10px; color: #1d4ed8; margin: 30px 0; border: 2px solid #dbeafe;">
                  ${otp}
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">SafeDrive QR System &bull; Secure Parking & Emergency Contact</p>
              </div>
            </div>
          `,
            });
        } catch (mailError: any) {
            console.error("Mail Send Error:", mailError);
            throw new Error(`Failed to send email: ${mailError.message}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("OTP Route Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

