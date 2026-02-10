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

async function diagnose() {
    console.log('--- DIAGNOSIS START ---');

    // 1. Find QR #15 by vehicle number
    console.log('1. Finding "MH 10 AJ"...');
    const { data: qrs, error: findError } = await supabase
        .from('qr_codes')
        .select('*')
        .ilike('vehicle_number', '%MH 10 AJ%');

    if (findError || !qrs || qrs.length === 0) {
        console.error('Failed to find QR code:', findError || 'Not found');
        return;
    }

    const targetQR = qrs[0];
    console.log(`Found QR: ID=${targetQR.id}, UniqueID=${targetQR.qr_unique_id}, Vehicle=${targetQR.vehicle_number}`);

    // 2. Insert Scan Log
    console.log('2. Inserting test scan log for this ID...');
    const { data: log, error: logError } = await supabase
        .from('scan_logs')
        .insert({
            qr_code_id: targetQR.id,
            scan_type: 'normal',
            scanner_ip: 'TEST_DIAGNOSIS',
            location_lat: 0,
            location_lng: 0
        })
        .select()
        .single();

    if (logError) {
        console.error('Insert failed:', logError);
        return;
    }
    console.log(`Log created: ${log.id}`);

    // 3. Verify Log
    console.log('3. Reading back log with join...');
    const { data: verifyLog, error: verifyError } = await supabase
        .from('scan_logs')
        .select(`
            id,
            qr_code_id,
            qr_codes (
                id,
                qr_unique_id,
                vehicle_number
            )
        `)
        .eq('id', log.id)
        .single();

    if (verifyError) {
        console.error('Verify failed:', verifyError);
        return;
    }

    const joinedQR = verifyLog.qr_codes;
    console.log(`Log Verification:
        Log ID: ${verifyLog.id}
        Linked QR ID: ${verifyLog.qr_code_id}
        Joined QR UniqueID: ${joinedQR?.qr_unique_id}
        Joined QR Vehicle: ${joinedQR?.vehicle_number}
    `);

    if (joinedQR?.vehicle_number === targetQR.vehicle_number) {
        console.log('SUCCESS: Log points to correct QR.');
    } else {
        console.error('FAILURE: Log points to WRONG data!');
    }
}

diagnose();
