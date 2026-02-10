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

async function cleanup() {
    console.log('--- CLEANUP START ---');
    console.log('Deleting ALL scan logs...');

    // We need to delete without WHERE clause, but Supabase RLS policies might require one,
    // or 'delete()' expects at least one filter usually.
    // However, if we want to delete ALL, we can filter by ID is not null.
    // Or just .neq('id', '00000000-0000-0000-0000-000000000000') (which works for all standard UUIDs).

    const { error, count } = await supabase
        .from('scan_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Cleanup failed:', error);
    } else {
        console.log(`Cleanup SUCCESS. Deleted rows.`);
    }
}

cleanup();
