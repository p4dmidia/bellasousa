import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
  const ids = [
    'e28b269f-4e15-4c58-8b9c-2e0c1dd2e0a5',
    'b95451a8-7ed5-431a-8514-741fc95562f6'
  ];
  
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, organization_id')
    .in('id', ids);

  if (error) {
    console.error('Error:', error);
  } else {
    console.table(users);
  }
}

checkIds();
