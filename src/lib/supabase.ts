import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ORGANIZATION_ID = '512f9aeb-683a-49c0-9731-76a7c8d10e8d';

// Helper function to ensure all queries include the mandatory organization filter
export const tenantQuery = (table: string) => {
  return supabase.from(table).select('*').eq('organization_id', ORGANIZATION_ID);
};
