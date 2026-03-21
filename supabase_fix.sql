-- Ensure the user_profiles table has the necessary columns
ALTER TABLE IF EXISTS public.user_profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS login TEXT;

-- Indexing for faster login search
CREATE INDEX IF NOT EXISTS idx_user_profiles_cpf ON public.user_profiles (cpf);
CREATE INDEX IF NOT EXISTS idx_user_profiles_login ON public.user_profiles (login);

-- RLS: Allow anonymous users to find emails by identifier during login
-- WARNING: Only expose the email column for this specific search
CREATE POLICY "Allow public login lookup" ON public.user_profiles
    FOR SELECT
    USING (true); -- Adjust this if you want to be more restrictive, 
                 -- but Login.tsx needs to query it before auth.

-- If you have a trigger that copies metadata from auth.users to public.user_profiles,
-- make sure it captures 'cpf' and 'login' from the 'raw_user_meta_data' JSON.
