-- Migration to fix multi-tenant isolation and correct cross-organization linkages
-- Created: 2026-04-28

-- 1. Update handle_new_user trigger to be organization-aware
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_code TEXT;
  v_org_id UUID;
BEGIN
  -- Capturar os dados brutos da metadata
  v_referrer_code := NEW.raw_user_meta_data->>'referrer_id';
  
  -- Tentar converter organization_id de forma segura
  BEGIN
    IF (NEW.raw_user_meta_data->>'organization_id') IS NOT NULL THEN
      v_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;

  -- Resolução Robusta do Referrer (Indicador) - RESTRITA À ORGANIZAÇÃO
  IF v_referrer_code IS NOT NULL AND v_referrer_code <> '' THEN
    -- 1. Se já for um UUID válido, tenta verificar se pertence à mesma organização
    IF v_referrer_code ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      SELECT id INTO v_referrer_id 
      FROM public.user_profiles 
      WHERE id = v_referrer_code::UUID 
      AND (organization_id = v_org_id OR v_org_id IS NULL);
    ELSE
      -- 2. Tenta buscar por e-mail ou login (Busca restrita à organização para evitar conflitos multi-tenant)
      SELECT id INTO v_referrer_id 
      FROM public.user_profiles 
      WHERE (email ILIKE v_referrer_code OR login ILIKE v_referrer_code)
      AND (organization_id = v_org_id OR v_org_id IS NULL)
      LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.user_profiles (
    id, 
    email, 
    login, 
    whatsapp, 
    full_name, 
    organization_id, 
    referrer_id, 
    sponsor_id,
    role,
    last_activation_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'full_name',
    v_org_id,
    v_referrer_id,
    v_referrer_id,
    'affiliate',
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp),
    login = COALESCE(EXCLUDED.login, user_profiles.login),
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    organization_id = COALESCE(EXCLUDED.organization_id, user_profiles.organization_id),
    referrer_id = COALESCE(EXCLUDED.referrer_id, user_profiles.referrer_id),
    sponsor_id = COALESCE(EXCLUDED.sponsor_id, user_profiles.sponsor_id);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clean up existing cross-organization linkages
UPDATE public.user_profiles u
SET 
    referrer_id = NULL,
    sponsor_id = NULL
FROM public.user_profiles r
WHERE u.referrer_id = r.id 
AND u.organization_id != r.organization_id;

-- 3. Specific fix for Paula Gonçalves (ensure she is unlinked from the wrong org referrer)
UPDATE public.user_profiles
SET referrer_id = NULL, sponsor_id = NULL
WHERE email = 'paulagoncalves@gmail.com'
AND (SELECT organization_id FROM public.user_profiles WHERE id = referrer_id) != organization_id;
