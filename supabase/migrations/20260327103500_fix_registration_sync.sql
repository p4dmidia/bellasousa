-- Fix Registration: Missing columns and trigger hardening
-- 1. Add missing columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- 2. Update handle_new_user function to sync all fields and handle UUIDs safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_ref_id UUID;
    v_login TEXT;
BEGIN
    -- Safely parse UUIDs from metadata strings (avoiding errors on empty strings)
    v_org_id := NULLIF(NEW.raw_user_meta_data->>'organization_id', '')::UUID;
    v_ref_id := NULLIF(NEW.raw_user_meta_data->>'referrer_id', '')::UUID;
    
    -- Determine login (metadata usage or fallback to email part)
    v_login := COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1));

    INSERT INTO public.user_profiles (
        id, 
        email, 
        login, 
        whatsapp, 
        full_name, 
        city,
        pix_key,
        organization_id, 
        referrer_id, 
        role,
        status,
        is_active
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_login,
        NEW.raw_user_meta_data->>'whatsapp',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'city',
        NEW.raw_user_meta_data->>'pix_key',
        v_org_id,
        v_ref_id,
        'affiliate',
        'active', -- Set to active by default as per most common app flow
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp),
        login = COALESCE(EXCLUDED.login, user_profiles.login),
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        city = COALESCE(EXCLUDED.city, user_profiles.city),
        pix_key = COALESCE(EXCLUDED.pix_key, user_profiles.pix_key),
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
