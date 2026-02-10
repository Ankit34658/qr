const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/"/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debug() {
    console.log('Fetching Scan Logs...');
    const { data: logs, error } = await supabase
        .from('scan_logs')
        .select(`
            id,
            qr_code_id,
            created_at,
            qr_codes (
                id,
                qr_unique_id,
                vehicle_number
            )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(logs, null, 2));
}

debug();
