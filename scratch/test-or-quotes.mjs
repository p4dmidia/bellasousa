import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const email = 'edigleza33_sousa@hotmail.com';
  
  console.log("Testing query WITHOUT quotes...");
  const { data: d1, error: e1 } = await supabase
    .from('user_profiles')
    .select('id')
    .or(`email.ilike.${email},login.ilike.${email}`)
    .maybeSingle();
  
  if (e1) console.log("Error 1:", e1.message);
  else console.log("Result 1:", d1 ? "Found" : "Not Found");

  console.log("\nTesting query WITH quotes...");
  const { data: d2, error: e2 } = await supabase
    .from('user_profiles')
    .select('id')
    .or(`email.ilike."${email}",login.ilike."${email}"`)
    .maybeSingle();
  
  if (e2) console.log("Error 2:", e2.message);
  else console.log("Result 2:", d2 ? "Found" : "Not Found");
}

main();
