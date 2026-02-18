import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        console.log("Testing Supabase Connection...");
        console.log("URL Configured:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("Key Configured:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        const { data, error } = await supabase.from('users').select('count').limit(1);

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ success: false, error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Connection Successful", data });
    } catch (e: any) {
        console.error("Connection Exception:", e);
        return NextResponse.json({ success: false, error: e.message, cause: e.cause }, { status: 500 });
    }
}
