-- Robust Registration Fix
-- 1. Redefine handle_new_user with better error handling and FK checks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_ref_id UUID;
    v_login TEXT;
    v_meta JSONB;
BEGIN
    v_meta := NEW.raw_user_meta_data;
    
    -- Safely parse Org ID (fallback to standard if missing/invalid)
    BEGIN
        v_org_id := (v_meta->>'organization_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_org_id := '512f9aeb-683a-49c0-9731-76a7c8d10e8d'::UUID;
    END;
    
    IF v_org_id IS NULL THEN
        v_org_id := '512f9aeb-683a-49c0-9731-76a7c8d10e8d'::UUID;
    END IF;

    -- Safely parse and VERIFY Referrer ID (avoid FK violation)
    BEGIN
        v_ref_id := (v_meta->>'referrer_id')::UUID;
        
        -- Check if it exists in user_profiles
        IF v_ref_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = v_ref_id) THEN
                v_ref_id := NULL; -- Invalidate if not found
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_ref_id := NULL;
    END;
    
    -- Prepare Login with fallback
    v_login := COALESCE(v_meta->>'login', split_part(NEW.email, '@', 1));

    -- Insert into user_profiles
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
        v_ref_id, -- Set sponsor_id = referrer_id initially
        'affiliate',
        'active',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp),
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        referrer_id = COALESCE(user_profiles.referrer_id, EXCLUDED.referrer_id),
        sponsor_id = COALESCE(user_profiles.sponsor_id, EXCLUDED.sponsor_id),
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-attach trigger if somehow dropped
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
