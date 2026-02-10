const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/"/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('Fetching activated QRs...');
    const { data: qrs, error } = await supabase
        .from('qr_codes')
        .select('id, qr_unique_id, vehicle_number')
        .not('vehicle_number', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(qrs, null, 2));
}

debug();
