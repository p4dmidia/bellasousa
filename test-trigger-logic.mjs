import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';
const ORGANIZATION_ID = '512f9aeb-683a-49c0-9731-76a7c8d10e8d';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("--- SITE CONFIGS ---");
  const { data: config, error: configError } = await supabase
    .from('site_configs')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .maybeSingle();

  if (configError) console.error(configError);
  else console.log(JSON.stringify(config, null, 2));

  console.log("\n--- ORDERS TABLE SCHEMA (via sample *) ---");
  const { data: orderSample, error: sampleError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (sampleError) console.error(sampleError);
  else {
    console.log("COLUMNS:", Object.keys(orderSample[0] || {}));
    console.log("CONTENT:", JSON.stringify(orderSample[0], null, 2));
  }
}
main();
