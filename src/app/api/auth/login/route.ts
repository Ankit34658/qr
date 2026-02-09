
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Check if user exists in the custom users table
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
        }

        // Verify password (Base64 check as per registration)
        const inputHash = Buffer.from(password).toString('base64');

        if (user.password_hash !== inputHash) {
            return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
        }

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
