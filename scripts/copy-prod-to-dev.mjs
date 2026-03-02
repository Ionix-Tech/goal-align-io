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

async function fetchAll(client, table) {
  const { data, error } = await client.from(table).select('*');
  if (error) {
    console.log(`  ⚠ Error reading ${table}: ${error.message}`);
    return [];
  }
  return data || [];
}

async function upsertAll(client, table, rows) {
  if (!rows.length) {
    console.log(`  - ${table}: 0 rows, skipping`);
    return;
  }
  const { error } = await client.from(table).upsert(rows, { onConflict: 'id', ignoreDuplicates: false });
  if (error) {
    console.log(`  ✗ Error writing ${table}: ${error.message}`);
    // Try one by one to identify problematic rows
    let ok = 0, fail = 0;
    for (const row of rows) {
      const { error: e2 } = await client.from(table).upsert(row, { onConflict: 'id', ignoreDuplicates: false });
      if (e2) {
        fail++;
        if (fail <= 3) console.log(`    Row ${row.id}: ${e2.message}`);
      } else {
        ok++;
      }
    }
    console.log(`    Inserted ${ok}/${rows.length} (${fail} failed)`);
  } else {
    console.log(`  ✓ ${table}: ${rows.length} rows`);
  }
}

async function copyAuthUsers() {
  console.log('\n=== Step 1: Copy auth users ===');

  // List users from prod
  const { data: prodUsers, error: listErr } = await prod.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.log(`  ✗ Error listing prod users: ${listErr.message}`);
    return;
  }
  console.log(`  Found ${prodUsers.users.length} users in Prod`);

  // List existing dev users
  const { data: devUsers } = await dev.auth.admin.listUsers({ perPage: 1000 });
  const devEmails = new Set((devUsers?.users || []).map(u => u.email));

  for (const user of prodUsers.users) {
    if (devEmails.has(user.email)) {
      console.log(`  - ${user.email}: already exists in Dev`);
      continue;
    }

    const { error: createErr } = await dev.auth.admin.createUser({
      email: user.email,
      password: 'Compas2025!',
      email_confirm: true,
      user_metadata: user.user_metadata || {},
    });

    if (createErr) {
      console.log(`  ✗ ${user.email}: ${createErr.message}`);
    } else {
      console.log(`  ✓ ${user.email}: created`);
    }
  }

  // Now we need to map prod user IDs to dev user IDs
  const { data: devUsersAfter } = await dev.auth.admin.listUsers({ perPage: 1000 });
  const prodIdToDevId = {};

  for (const prodUser of prodUsers.users) {
    const devUser = devUsersAfter.users.find(u => u.email === prodUser.email);
    if (devUser) {
      prodIdToDevId[prodUser.id] = devUser.id;
    }
  }

  console.log(`  Mapped ${Object.keys(prodIdToDevId).length} user IDs`);
  return prodIdToDevId;
}

function remapUserIds(rows, idMap, userFields) {
  return rows.map(row => {
    const newRow = { ...row };
    for (const field of userFields) {
      if (newRow[field] && idMap[newRow[field]]) {
        newRow[field] = idMap[newRow[field]];
      }
    }
    return newRow;
  });
}

async function updateProfiles(idMap) {
  console.log('\n=== Step 2: Update profiles ===');
  const prodProfiles = await fetchAll(prod, 'profiles');

  // Remap profile IDs to dev user IDs
  const devProfiles = prodProfiles.map(p => ({
    ...p,
    id: idMap[p.id] || p.id,
  }));

  for (const profile of devProfiles) {
    const { error } = await dev.from('profiles').upsert(profile, { onConflict: 'id' });
    if (error) {
      console.log(`  ✗ Profile ${profile.email}: ${error.message}`);
    } else {
      console.log(`  ✓ Profile ${profile.email}`);
    }
  }

  return prodProfiles;
}

async function copyUserRoles(idMap) {
  console.log('\n=== Step 3: Copy user_roles ===');
  const prodRoles = await fetchAll(prod, 'user_roles');
  const devRoles = remapUserIds(prodRoles, idMap, ['user_id']).map(r => {
    const { id, ...rest } = r; // remove id to avoid conflicts, let it auto-generate
    return rest;
  });

  for (const role of devRoles) {
    const { error } = await dev.from('user_roles').upsert(role, { onConflict: 'user_id,role', ignoreDuplicates: true });
    if (error && !error.message.includes('duplicate')) {
      console.log(`  ✗ Role ${role.user_id}/${role.role}: ${error.message}`);
    } else {
      console.log(`  ✓ Role ${role.role} for user`);
    }
  }
}

async function main() {
  console.log('🚀 Copying Prod data to Dev...\n');

  // Step 1: Copy auth users and get ID mapping
  const idMap = await copyAuthUsers();
  if (!idMap) {
    console.log('Failed to copy users, aborting.');
    return;
  }

  // Step 2: Update profiles with remapped IDs
  await updateProfiles(idMap);

  // Step 3: Copy user roles
  await copyUserRoles(idMap);

  // User ID fields per table
  const userFields = {
    areas: ['manager_id'],
    strategic_pillars: [],
    strategic_theses: ['created_by'],
    thesis_kpis: [],
    projects: ['created_by', 'assigned_to', 'approved_by'],
    project_members: ['user_id', 'added_by'],
    project_indicators: [],
    project_milestones: [],
    project_requirements: [],
    project_tasks: ['assigned_to', 'created_by'],
    project_situations: ['created_by'],
    project_comments: ['user_id'],
    project_attachments: ['uploaded_by'],
    project_why_links: [],
    kpis: ['owner_id', 'created_by'],
    kpi_monthly_values: ['updated_by'],
    project_kpi_links: ['linked_by'],
    project_strategic_kpis: [],
    thesis_kpi_measurements: ['measured_by'],
    notifications: ['user_id'],
    project_weekly_updates: ['submitted_by'],
    project_health_status: ['reported_by'],
    workload_settings: ['updated_by'],
  };

  // Tables in dependency order
  const tables = [
    'areas',
    'strategic_pillars',
    'strategic_theses',
    'thesis_kpis',
    'projects',
    'project_members',
    'project_indicators',
    'project_milestones',
    'project_requirements',
    'project_tasks',
    'project_situations',
    'project_comments',
    'project_attachments',
    'project_why_links',
    'kpis',
    'kpi_monthly_values',
    'project_kpi_links',
    'project_strategic_kpis',
    'thesis_kpi_measurements',
    'notifications',
    'project_weekly_updates',
    'project_health_status',
  ];

  for (const table of tables) {
    console.log(`\n=== Copying ${table} ===`);
    let rows = await fetchAll(prod, table);

    if (table === 'strategic_pillars') {
      // These are already seeded by migration, skip
      console.log(`  - Skipping (seeded by migration), ${rows.length} rows in prod`);

      // But we need to map pillar IDs if they differ
      const devPillars = await fetchAll(dev, 'strategic_pillars');
      for (const prodPillar of rows) {
        const devPillar = devPillars.find(p => p.pillar_type === prodPillar.pillar_type);
        if (devPillar && devPillar.id !== prodPillar.id) {
          idMap[prodPillar.id] = devPillar.id;
          console.log(`  Mapped pillar ${prodPillar.pillar_type}: ${prodPillar.id} → ${devPillar.id}`);
        }
      }
      continue;
    }

    // Remap user IDs
    const fields = userFields[table] || [];
    if (fields.length > 0) {
      rows = remapUserIds(rows, idMap, fields);
    }

    // Remap pillar_id, thesis_id, objective_id if present
    rows = rows.map(row => {
      const newRow = { ...row };
      if (newRow.pillar_id && idMap[newRow.pillar_id]) newRow.pillar_id = idMap[newRow.pillar_id];
      if (newRow.thesis_id && idMap[newRow.thesis_id]) newRow.thesis_id = idMap[newRow.thesis_id];
      if (newRow.objective_id && idMap[newRow.objective_id]) newRow.objective_id = idMap[newRow.objective_id];
      if (newRow.source_idea_id && idMap[newRow.source_idea_id]) newRow.source_idea_id = idMap[newRow.source_idea_id];
      return newRow;
    });

    await upsertAll(dev, table, rows);
  }

  console.log('\n✅ Done! Refresh localhost:8080 to see the data.');
}

main().catch(console.error);
