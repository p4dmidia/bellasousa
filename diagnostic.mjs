import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("--- DIAGNOSTIC: rafaella@email.com ---");
  
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', 'rafaella@email.com')
    .maybeSingle();
    
  if (userError) {
    console.error("Error fetching rafaella:", userError);
    return;
  }
  
  if (!user) {
    console.log("User rafaella@email.com NOT FOUND in user_profiles.");
    return;
  }
  
  console.log("User found:", {
    id: user.id,
    email: user.email,
    login: user.login,
    referrer_id: user.referrer_id,
    organization_id: user.organization_id,
    role: user.role
  });
  
  if (user.referrer_id) {
    const { data: referrer, error: refError } = await supabase
      .from('user_profiles')
      .select('id, email, login, organization_id')
      .eq('id', user.referrer_id)
      .maybeSingle();
      
    if (refError) {
      console.error("Error fetching referrer:", refError);
    } else if (!referrer) {
      console.log("Referrer ID", user.referrer_id, "NOT FOUND in user_profiles.");
    } else {
      console.log("Referrer found:", referrer);
    }
  } else {
    console.log("User has NO referrer_id.");
  }
  
  // Also check if there are any other users with the same organization
  const { count, error: countError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', user.organization_id);
    
  console.log(`Total users in organization ${user.organization_id}: ${count}`);
}

main();
