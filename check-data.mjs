import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: allData, error } = await supabase
    .from('user_profiles')
    .select('id, referrer_id, sponsor_id');
  
  if (error) {
    console.error(error);
  } else {
    const total = allData.length;
    const withRef = allData.filter(u => u.referrer_id !== null).length;
    const withSpon = allData.filter(u => u.sponsor_id !== null).length;
    
    console.log("RESULT_TOTAL:" + total);
    console.log("RESULT_REFERRER:" + withRef);
    console.log("RESULT_SPONSOR:" + withSpon);
    
    if (withRef > 0) {
      console.log("REF_EXAMPLE:" + allData.find(u => u.referrer_id !== null).referrer_id);
    }
    if (withSpon > 0) {
      console.log("SPON_EXAMPLE:" + allData.find(u => u.sponsor_id !== null).sponsor_id);
    }
  }
}
main();
