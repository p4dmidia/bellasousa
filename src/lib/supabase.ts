import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ORGANIZATION_ID = import.meta.env.VITE_ORGANIZATION_ID;

// Helper function to ensure all queries include the mandatory organization filter
export const tenantQuery = (table: string) => {
  return supabase.from(table).select('*').eq('organization_id', ORGANIZATION_ID);
};
