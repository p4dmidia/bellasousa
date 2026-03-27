import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, login, referrer_id, sponsor_id, organization_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error(error);
  } else {
    console.log("RECENT_USERS:");
    data.forEach(u => {
      console.log(`ID: ${u.id} | Email: ${u.email} | Ref: ${u.referrer_id} | Spon: ${u.sponsor_id} | Org: ${u.organization_id} | Created: ${u.created_at}`);
    });
  }
}
main();
