import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';
const ORGANIZATION_ID = '512f9aeb-683a-49c0-9731-76a7c8d10e8d';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSearch(ref) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  
  // LOGICA NOVA
  let query = supabase.from('user_profiles').select('id, email, login, cpf, organization_id');
  if (isUUID) {
      query = query.or(`id.eq.${ref},email.ilike.${ref},login.ilike.${ref}`);
  } else {
      const sanitizedCpf = ref.replace(/\D/g, '');
      query = query.or(`email.ilike.${ref},login.ilike.${ref},cpf.eq.${ref},cpf.eq.${sanitizedCpf}`);
  }

  const { data, error } = await query
      .eq('organization_id', ORGANIZATION_ID)
      .maybeSingle();
  
  let result = data;
  let method = "STANDARD (with org filter)";

  if (!result) {
      // FALLBACK
      let globalQuery = supabase.from('user_profiles').select('id, email, login, cpf, organization_id');
      if (isUUID) {
          globalQuery = globalQuery.or(`id.eq.${ref},email.ilike.${ref},login.ilike.${ref}`);
      } else {
          const sanitizedCpf = ref.replace(/\D/g, '');
          globalQuery = globalQuery.or(`email.ilike.${ref},login.ilike.${ref},cpf.eq.${ref},cpf.eq.${sanitizedCpf}`);
      }
      const { data: globalData } = await globalQuery.maybeSingle();
      result = globalData;
      method = "GLOBAL FALLBACK (no org filter)";
  }

  if (error) {
    console.log(`ERROR for [${ref}]:`, error.message);
  } else if (result) {
    console.log(`FOUND for [${ref}] via ${method}: ID=${result.id}, Login=${result.login}, Org=${result.organization_id}`);
  } else {
    console.log(`NOT FOUND for [${ref}]`);
  }
}

async function main() {
  console.log("Testing search logic with improvements...\n");
  
  // 1. Get a user from the OTHER organization to test fallback
  const { data: otherOrgUsers } = await supabase.from('user_profiles')
    .select('id, email, login, cpf, organization_id')
    .neq('organization_id', ORGANIZATION_ID)
    .limit(3);
  
  if (otherOrgUsers && otherOrgUsers.length > 0) {
      console.log("Testing with users from OTHER organization (should only work with fallback):");
      for (const u of otherOrgUsers) {
          await testSearch(u.id);
          if (u.login) {
              await testSearch(u.login.toLowerCase()); // Test case-insensitivity
              await testSearch(u.login.toUpperCase()); // Test case-insensitivity
          }
      }
  }

  // 2. Get a user from the CURRENT organization to test standard
  const { data: currentOrgUsers } = await supabase.from('user_profiles')
    .select('id, email, login, cpf, organization_id')
    .eq('organization_id', ORGANIZATION_ID)
    .limit(3);

  if (currentOrgUsers && currentOrgUsers.length > 0) {
      console.log("\nTesting with users from CURRENT organization (should work with standard):");
      for (const u of currentOrgUsers) {
          await testSearch(u.id);
          if (u.login) await testSearch(u.login);
      }
  }
}

main();
