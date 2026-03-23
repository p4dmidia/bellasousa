import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const tables = ['user_profiles', 'orders', 'site_configs'];
  let result = "";
  for (const table of tables) {
    const { data } = await supabase.from(table).select('*').limit(1);
    if (data && data.length > 0) {
      result += `\nTABLE: ${table}\nCOLUMNS: ${Object.keys(data[0]).join(', ')}\n`;
    }
  }
  fs.writeFileSync('all_columns.txt', result);
}
main();
