import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: users } = await supabase.from('user_profiles').select('id, email, referrer_id, balance');
  const { data: orders } = await supabase.from('orders').select('id, status, affiliate_id, total_amount, commission_amount').order('created_at', { ascending: false }).limit(5);
  const out = { users, orders };
  fs.writeFileSync('test-check.json', JSON.stringify(out, null, 2), 'utf8');
}
main();
