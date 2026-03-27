-- ULTIMATE REGISTRATION FIX: Clean state and robust mapping
-- 1. Ensure columns exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2. Drop old versions to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create the robust sync function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_ref_id UUID;
    v_login TEXT;
    v_meta JSONB;
BEGIN
    v_meta := NEW.raw_user_meta_data;
    
    -- Safely parse UUIDs (handling null/empty strings/invalid formats)
    BEGIN
        v_org_id := (v_meta->>'organization_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_org_id := '512f9aeb-683a-49c0-9731-76a7c8d10e8d'::UUID; -- Fallback to Default Org ID
    END;

    BEGIN
        v_ref_id := (v_meta->>'referrer_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_ref_id := NULL;
    END;
    
    v_login := COALESCE(v_meta->>'login', split_part(NEW.email, '@', 1));

    INSERT INTO public.user_profiles (
        id, email, login, whatsapp, full_name, city, pix_key, 
        organization_id, referrer_id, sponsor_id, role, status, is_active
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_login,
        COALESCE(v_meta->>'whatsapp', v_meta->>'phone'),
        COALESCE(v_meta->>'full_name', v_meta->>'nome'),
        v_meta->>'city',
        COALESCE(v_meta->>'pix_key', v_meta->>'pix'),
        v_org_id,
        v_ref_id,
        v_ref_id, -- Set sponsor_id = referrer_id
        'affiliate',
        'active',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp),
        login = COALESCE(EXCLUDED.login, user_profiles.login),
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        city = COALESCE(EXCLUDED.city, user_profiles.city),
        pix_key = COALESCE(EXCLUDED.pix_key, user_profiles.pix_key),
        referrer_id = COALESCE(user_profiles.referrer_id, EXCLUDED.referrer_id),
        sponsor_id = COALESCE(user_profiles.sponsor_id, EXCLUDED.sponsor_id),
        organization_id = COALESCE(user_profiles.organization_id, EXCLUDED.organization_id),
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create the trigger for public.handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
