import pg from 'pg';
const { Client } = pg;

const sql = `
ALTER TABLE public.kpis
  ADD COLUMN IF NOT EXISTS display_format TEXT NOT NULL DEFAULT 'percentage'
    CHECK (display_format IN ('percentage', 'absolute')),
  ADD COLUMN IF NOT EXISTS ytd_mode TEXT NOT NULL DEFAULT 'accumulated'
    CHECK (ytd_mode IN ('accumulated', 'average'));
`;

const databases = [
  { name: 'DEV', url: 'postgresql://postgres:Compas2025!@db.drtxejwrlyoxobvkcqrt.supabase.co:5432/postgres' },
  { name: 'PROD', url: 'postgresql://postgres:Compas2025!@db.hhzsdmvqgrktncusjgfw.supabase.co:5432/postgres' },
];

for (const db of databases) {
  const client = new Client({ connectionString: db.url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql);
    console.log(`${db.name}: ✓ Migration applied`);
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(`${db.name}: ✓ Columns already exist`);
    } else {
      console.log(`${db.name}: ✗ ${err.message}`);
    }
  } finally {
    await client.end();
  }
}
