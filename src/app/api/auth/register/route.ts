import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, mobile } = body;

        console.log("Register Attempt:", { name, email, mobile }); // Debug log

        if (!name || !email || !password || !mobile) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // In a real app, use Supabase Auth or hash password
        // Base64 encoding as requested by user
        const passwordHash = Buffer.from(password).toString('base64');

        const { data: user, error } = await supabase
            .from('users')
            .insert([
                {
                    full_name: name,
                    email,
                    password_hash: passwordHash,
                    mobile_primary: mobile,
                    role: 'owner'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Supabase Register Error:", error);
            // Check for unique violation (Postgres code 23505)
            if (error.code === '23505') {
                return NextResponse.json({ success: false, error: "Email or Mobile already registered." }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        console.error("Internal Register Error:", error);
        if (error.cause) console.error("Error Cause:", error.cause);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
