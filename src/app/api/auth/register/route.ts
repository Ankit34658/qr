import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { name, email, password, mobile } = await request.json();

        // In a real app, use Supabase Auth or hash password
        const { data: user, error } = await supabase
            .from('users')
            .insert([
                { name, email, password_hash: password, mobile, role: 'admin' }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
