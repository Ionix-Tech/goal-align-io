import { createClient } from '@supabase/supabase-js';

const sql = `
ALTER TABLE public.kpis
  ADD COLUMN IF NOT EXISTS display_format TEXT NOT NULL DEFAULT 'percentage'
    CHECK (display_format IN ('percentage', 'absolute')),
  ADD COLUMN IF NOT EXISTS ytd_mode TEXT NOT NULL DEFAULT 'accumulated'
    CHECK (ytd_mode IN ('accumulated', 'average'));
`;

const dev = createClient(
  'https://drtxejwrlyoxobvkcqrt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydHhlandybHlveG9idmtjcXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NDQwOSwiZXhwIjoyMDg1NTYwNDA5fQ.oKAnjCjg2l6zYZRVmOlJLJIauYSj81lTTNV_a-SigyM'
);

const prod = createClient(
  'https://hhzsdmvqgrktncusjgfw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoenNkbXZxZ3JrdG5jdXNqZ2Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3ODA3NiwiZXhwIjoyMDg1NTU0MDc2fQ.9t6kMoIajTtQAuNCU95q0gPCEGKuG7pZPk5ay7bFiU4'
);

async function runSQL(client, name) {
  const { data, error } = await client.rpc('exec_sql', { sql_string: sql });
  if (error) {
    // Try direct approach via postgrest
    const { error: e2 } = await client.from('kpis').select('display_format').limit(1);
    if (e2 && e2.message.includes('display_format')) {
      console.log(`${name}: Column doesn't exist yet, need to run via SQL Editor`);
      return false;
    } else {
      console.log(`${name}: Column already exists!`);
      return true;
    }
  }
  console.log(`${name}: Migration applied successfully`);
  return true;
}

async function main() {
  console.log('Checking if columns already exist...\n');

  for (const [client, name] of [[dev, 'DEV'], [prod, 'PROD']]) {
    const { data, error } = await client.from('kpis').select('display_format').limit(1);
    if (error && error.message.includes('display_format')) {
      console.log(`${name}: display_format column NOT found - run migration via SQL Editor`);
    } else {
      console.log(`${name}: display_format column exists ✓`);
    }
  }

  console.log('\nIf columns are missing, run this SQL in the Supabase SQL Editor:');
  console.log(sql);
}

main().catch(console.error);
