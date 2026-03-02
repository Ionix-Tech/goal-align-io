import { createClient } from '@supabase/supabase-js';

const prod = createClient(
  'https://hhzsdmvqgrktncusjgfw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoenNkbXZxZ3JrdG5jdXNqZ2Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3ODA3NiwiZXhwIjoyMDg1NTU0MDc2fQ.9t6kMoIajTtQAuNCU95q0gPCEGKuG7pZPk5ay7bFiU4',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const dev = createClient(
  'https://drtxejwrlyoxobvkcqrt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydHhlandybHlveG9idmtjcXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NDQwOSwiZXhwIjoyMDg1NTYwNDA5fQ.oKAnjCjg2l6zYZRVmOlJLJIauYSj81lTTNV_a-SigyM',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('Fixing kpi_monthly_values...\n');

  // Get prod monthly values
  const { data: prodValues, error: e1 } = await prod.from('kpi_monthly_values').select('*');
  if (e1) { console.log('Error reading prod:', e1.message); return; }
  console.log(`Found ${prodValues.length} monthly values in Prod`);

  // Get dev monthly values
  const { data: devValues, error: e2 } = await dev.from('kpi_monthly_values').select('*');
  if (e2) { console.log('Error reading dev:', e2.message); return; }
  console.log(`Found ${devValues.length} monthly values in Dev`);

  // Update dev values by matching kpi_id + year + month
  let updated = 0, skipped = 0, failed = 0;
  for (const pv of prodValues) {
    const devRow = devValues.find(d => d.kpi_id === pv.kpi_id && d.year === pv.year && d.month === pv.month);
    if (!devRow) {
      skipped++;
      continue;
    }

    // Only update if prod has actual data
    if (pv.target_value !== null || pv.actual_value !== null || pv.notes) {
      const { error } = await dev.from('kpi_monthly_values')
        .update({
          target_value: pv.target_value,
          actual_value: pv.actual_value,
          status: pv.status,
          notes: pv.notes,
        })
        .eq('id', devRow.id);

      if (error) {
        failed++;
        if (failed <= 3) console.log(`  ✗ KPI ${pv.kpi_id} month ${pv.month}: ${error.message}`);
      } else {
        updated++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
