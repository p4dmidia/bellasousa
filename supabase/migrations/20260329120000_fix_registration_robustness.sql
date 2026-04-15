-- Robust Registration Fix
-- 1. Redefine handle_new_user with better error handling and FK checks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_ref_id UUID;
    v_login TEXT;
    v_meta JSONB;
    v_meta_ref TEXT;
BEGIN
    v_meta := NEW.raw_user_meta_data;
    v_meta_ref := NULLIF(v_meta->>'referrer_id', '');
    
    -- 1. TENTATIVA DE RESOLUÇÃO DO INDICADOR (REFERRER)
    IF v_meta_ref IS NOT NULL THEN
        -- Se for um UUID válido, tenta buscar por ID
        IF v_meta_ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            BEGIN
              SELECT id, organization_id INTO v_ref_id, v_org_id FROM public.user_profiles WHERE id = v_meta_ref::UUID LIMIT 1;
            EXCEPTION WHEN OTHERS THEN
              v_ref_id := NULL;
            END;
        END IF;

        -- Se não encontrou por ID ou não era UUID, tenta por Login ou E-mail
        IF v_ref_id IS NULL THEN
            SELECT id, organization_id INTO v_ref_id, v_org_id FROM public.user_profiles 
            WHERE login = v_meta_ref OR email = v_meta_ref OR cpf = REPLACE(REPLACE(v_meta_ref, '.', ''), '-', '')
            LIMIT 1;
        END IF;
    END IF;

    -- 2. RESOLUÇÃO DA ORGANIZAÇÃO (HERANÇA OU FALLBACK)
    -- Prioridade 1: Herança do indicador (v_org_id preenchido na busca acima)
    -- Prioridade 2: Valor enviado explicitamente na metadata
    -- Prioridade 3: Fallback padrão da rede Bela Sousa (5111af72-27a5-41fd-8ed9-8c51b78b4fdd)
    
    IF v_org_id IS NULL THEN
        BEGIN
            v_org_id := (v_meta->>'organization_id')::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_org_id := NULL;
        END;
    END IF;

    IF v_org_id IS NULL THEN
        v_org_id := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::UUID;
    END IF;

    -- 3. PREPARAÇÃO DO LOGIN
    v_login := COALESCE(v_meta->>'login', split_part(NEW.email, '@', 1));

    -- 4. INSERT NO PERFIL
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
        organization_id = COALESCE(user_profiles.organization_id, EXCLUDED.organization_id),
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-attach trigger if somehow dropped
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
