import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Fixing Rafaella...");
  
  // 1. Get Edigleza's ID
  const { data: edigleza } = await supabase
    .from('user_profiles')
    .select('id')
    .ilike('email', 'edigleza33_sousa@hotmail.com')
    .single();
    
  if (!edigleza) {
    console.error("Edigleza not found");
    return;
  }

  // 2. Link Rafaella
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      referrer_id: edigleza.id,
      sponsor_id: edigleza.id
    })
    .eq('email', 'rafaella@email.com');

  if (error) {
    console.error("Error linking:", error);
  } else {
    console.log("Rafaella linked successfully!");
  }
}

main();
