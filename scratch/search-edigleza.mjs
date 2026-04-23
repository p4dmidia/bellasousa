import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Searching for Edigleza...");
  
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('email, login, id')
    .ilike('email', '%Edigleza%');
  
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("Users found:", JSON.stringify(users, null, 2));
}

main();
