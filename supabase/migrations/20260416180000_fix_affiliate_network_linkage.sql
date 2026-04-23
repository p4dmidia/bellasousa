-- 1. Redefinir a função de criação de usuário com busca Case-Insensitive
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
    
    -- TENTATIVA DE RESOLUÇÃO DO INDICADOR (REFERRER)
    IF v_meta_ref IS NOT NULL THEN
        -- Se for um UUID válido, tenta buscar por ID
        IF v_meta_ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            BEGIN
              SELECT id, organization_id INTO v_ref_id, v_org_id FROM public.user_profiles WHERE id = v_meta_ref::UUID LIMIT 1;
            EXCEPTION WHEN OTHERS THEN
              v_ref_id := NULL;
            END;
        END IF;

        -- Se não encontrou por ID ou não era UUID, tenta por Login ou E-mail (CASE-INSENSITIVE)
        IF v_ref_id IS NULL THEN
            SELECT id, organization_id INTO v_ref_id, v_org_id FROM public.user_profiles 
            WHERE login ILIKE v_meta_ref 
               OR email ILIKE v_meta_ref 
               OR cpf = REPLACE(REPLACE(v_meta_ref, '.', ''), '-', '')
            LIMIT 1;
        END IF;
    END IF;

    -- RESOLUÇÃO DA ORGANIZAÇÃO
    IF v_org_id IS NULL THEN
        BEGIN
            v_org_id := (v_meta->>'organization_id')::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_org_id := NULL;
        END;
    END IF;

    IF v_org_id IS NULL THEN
        v_org_id := '512f9aeb-683a-49c0-9731-76a7c8d10e8d'::UUID; -- Fallback Bela Sousa
    END IF;

    -- PREPARAÇÃO DO LOGIN
    v_login := COALESCE(v_meta->>'login', split_part(NEW.email, '@', 1));

    -- INSERT OU UPDATE NO PERFIL
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
        v_ref_id, -- Sponsor inicial é o próprio indicador
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

-- 2. Garantir o Gatilho
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. CLEANUP: Corrigir usuários órfãos que não foram vinculados corretamente
-- Parte A: Recuperar via UUID no meta (Apenas se o UUID existir na tabela auth.users)
UPDATE public.user_profiles up
SET referrer_id = (au.raw_user_meta_data->>'referrer_id')::UUID,
    sponsor_id = COALESCE(up.sponsor_id, (au.raw_user_meta_data->>'referrer_id')::UUID)
FROM auth.users au
WHERE up.id = au.id
AND (up.referrer_id IS NULL OR up.sponsor_id IS NULL)
AND au.raw_user_meta_data->>'referrer_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
AND EXISTS (SELECT 1 FROM auth.users au2 WHERE au2.id = (au.raw_user_meta_data->>'referrer_id')::UUID);

-- Parte B: Recuperar via Login ou E-mail (Case-Insensitive)
UPDATE public.user_profiles up
SET referrer_id = ref.id,
    sponsor_id = COALESCE(up.sponsor_id, ref.id)
FROM auth.users au
JOIN public.user_profiles ref ON (
    ref.login ILIKE au.raw_user_meta_data->>'referrer_id' OR 
    ref.email ILIKE au.raw_user_meta_data->>'referrer_id'
)
WHERE up.id = au.id
AND (up.referrer_id IS NULL OR up.sponsor_id IS NULL)
AND au.raw_user_meta_data->>'referrer_id' IS NOT NULL
AND au.raw_user_meta_data->>'referrer_id' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
