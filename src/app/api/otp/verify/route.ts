import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { email, otp_code, qr_id } = await request.json();

        // 1. Verify OTP
        const { data: verification, error: verifyError } = await supabase
            .from('otp_verifications')
            .select('*')
            .eq('identifier', email)
            .eq('otp_code', otp_code)
            .eq('qr_code_id', qr_id)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (verifyError || !verification) {
            return NextResponse.json({ success: false, error: 'Invalid or expired code' }, { status: 400 });
        }

        // 2. Mark OTP as verified
        await supabase
            .from('otp_verifications')
            .update({ verified: true })
            .eq('id', verification.id);

        // 3. Generate Temporary Contact Token (30 mins)
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const { error: tokenError } = await supabase
            .from('contact_tokens')
            .insert([
                {
                    qr_code_id: qr_id,
                    token: token,
                    scanner_identifier: email,
                    expires_at: expiresAt
                }
            ]);

        if (tokenError) throw tokenError;

        return NextResponse.json({
            success: true,
            token: token,
            expires_at: expiresAt
        });

    } catch (error: any) {
        console.error("OTP Verify Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
