import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
  if (data && data.length > 0) {
    const keys = Object.keys(data[0]);
    fs.writeFileSync('cols.json', JSON.stringify(keys, null, 2), 'utf8');
  } else {
    fs.writeFileSync('cols.json', JSON.stringify(error), 'utf8');
  }
}
main();
