import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentUsers() {
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, referrer_id, sponsor_id, created_at, organization_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.table(users);
  }
}

checkRecentUsers();
