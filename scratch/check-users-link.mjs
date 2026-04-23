import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Checking users...");
  
  const emails = ['gerlianeoliveiracampos@gmail.com', 'pereiratais222@gmail.com'];
  
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, email, login, referrer_id, sponsor_id, organization_id, created_at')
    .in('email', emails);
  
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("Found users:", JSON.stringify(users, null, 2));

  const gerliane = users.find(u => u.email === 'gerlianeoliveiracampos@gmail.com');
  const tais = users.find(u => u.email === 'pereiratais222@gmail.com');

  if (!gerliane) {
    console.log("User gerlianeoliveiracampos@gmail.com NOT found in user_profiles.");
  } else {
    console.log("Gerliane exists. Referrer ID:", gerliane.referrer_id);
    if (tais && gerliane.referrer_id === tais.id) {
        console.log("Link is CORRECT between Gerliane and Tais.");
    } else if (tais) {
        console.log("Link is INCORRECT. Tais ID is:", tais.id, "but Gerliane has:", gerliane.referrer_id);
    } else {
        console.log("Tais NOT found, so cannot verify link.");
    }
  }

  if (!tais) {
    console.log("User pereiratais222@gmail.com NOT found in user_profiles.");
  }
}

main();
