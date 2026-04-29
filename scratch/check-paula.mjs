import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const email = 'paulagoncalves@gmail.com';
  console.log(`Checking for user: ${email}`);
  
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .or(`email.ilike.${email},login.ilike.${email}`);

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  } else {
    console.log('Profiles found:', profiles);
  }

  // Also check if we can see the organization_id from .env
  console.log('Current VITE_ORGANIZATION_ID:', process.env.VITE_ORGANIZATION_ID);
}

checkUser();
