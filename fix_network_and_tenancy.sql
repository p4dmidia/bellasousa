-- 1. RESTAURAÇÃO COMPLETA E ROBUSTA DO GATILHO DE USUÁRIO (MULTI-TENANT AWARE)
-- Esta versão foca em resolver o problema de indicações sumindo e a interferência entre sistemas.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_ref_id UUID;
    v_login TEXT;
    v_meta JSONB;
    v_meta_ref TEXT;
    v_meta_org TEXT;
BEGIN
    v_meta := NEW.raw_user_meta_data;
    v_meta_ref := NULLIF(v_meta->>'referrer_id', '');
    v_meta_org := NULLIF(v_meta->>'organization_id', '');
    
    -- 1. RESOLUÇÃO DA ORGANIZAÇÃO (Prioridade para o que vem no Meta da Inscrição)
    IF v_meta_org IS NOT NULL THEN
        BEGIN
            v_org_id := v_meta_org::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_org_id := NULL;
        END;
    END IF;

    -- 2. TENTATIVA DE RESOLUÇÃO DO INDICADOR (REFERRER) - BUSCA GLOBAL (SECURITY DEFINER)
    IF v_meta_ref IS NOT NULL THEN
        -- A. Se for um UUID válido, tenta buscar por ID
        IF v_meta_ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            SELECT id, organization_id INTO v_ref_id, v_org_id 
            FROM public.user_profiles 
            WHERE id = v_meta_ref::UUID 
            LIMIT 1;
        END IF;

        -- B. Se não encontrou por ID, tenta por Login, E-mail ou CPF (CASE-INSENSITIVE)
        IF v_ref_id IS NULL THEN
            SELECT id, organization_id INTO v_ref_id, v_org_id 
            FROM public.user_profiles 
            WHERE (login ILIKE v_meta_ref OR email ILIKE v_meta_ref OR cpf = REPLACE(REPLACE(v_meta_ref, '.', ''), '-', ''))
            LIMIT 1;
        END IF;
    END IF;

    -- 3. RE-VALIDAÇÃO DA ORGANIZAÇÃO (Se ainda nula ou se o referrer for de outra org, mas o meta especificou uma)
    -- Se o meta da inscrição trouxe uma Org específica, ela deve prevalecer sobre a do referrer 
    -- para evitar que um sistema "puxe" o usuário para dentro do outro indevidamente.
    IF v_meta_org IS NOT NULL THEN
        v_org_id := v_meta_org::UUID;
    END IF;

    -- Fallback final para Bela Sousa se tudo falhar
    IF v_org_id IS NULL THEN
        v_org_id := '512f9aeb-683a-49c0-9731-76a7c8d10e8d'::UUID;
    END IF;

    -- 4. PREPARAÇÃO DOS DADOS ADICIONAIS
    v_login := COALESCE(v_meta->>'login', split_part(NEW.email, '@', 1));

    -- 5. INSERT OU UPDATE (MULTI-TENANT FIX)
    -- Importante: Se o usuário já existe, o ideal seria ele ter um perfil por Org.
    -- Como a PK atual é apenas o ID, vamos atualizar os dados, mas ser cuidadosos com a Org.
    INSERT INTO public.user_profiles (
        id, email, login, whatsapp, full_name, city, pix_key, cpf,
        organization_id, referrer_id, sponsor_id, role, status, is_active
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_login,
        COALESCE(v_meta->>'whatsapp', v_meta->>'phone', v_meta->>'tel'),
        COALESCE(v_meta->>'full_name', v_meta->>'nome', v_meta->>'name'),
        v_meta->>'city',
        COALESCE(v_meta->>'pix_key', v_meta->>'pix'),
        REPLACE(REPLACE(v_meta->>'cpf', '.', ''), '-', ''),
        v_org_id,
        v_ref_id,
        v_ref_id, -- Sponsor inicial é o indicador
        'affiliate',
        'active',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp),
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        cpf = COALESCE(user_profiles.cpf, EXCLUDED.cpf),
        -- Se o usuário está vindo de outro sistema (meta_org diferente), permitimos atualizar a org?
        -- Se mantivermos a antiga, ele não aparece no novo. Se trocarmos, some do antigo.
        -- SOLUÇÃO TEMPORÁRIA: Atualizar se o meta_org for fornecido explicitamente.
        organization_id = COALESCE(EXCLUDED.organization_id, user_profiles.organization_id),
        referrer_id = COALESCE(user_profiles.referrer_id, EXCLUDED.referrer_id),
        sponsor_id = COALESCE(user_profiles.sponsor_id, EXCLUDED.sponsor_id),
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. GARANTIR O GATILHO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. REPARAÇÃO IMEDIATA DA REDE (Rodar para corrigir quem sumiu)
-- Parte A: Restaurar referrer_id de quem está nulo mas tem no meta
UPDATE public.user_profiles up
SET referrer_id = (au.raw_user_meta_data->>'referrer_id')::UUID,
    sponsor_id = COALESCE(up.sponsor_id, (au.raw_user_meta_data->>'referrer_id')::UUID)
FROM auth.users au
WHERE up.id = au.id
AND up.referrer_id IS NULL
AND au.raw_user_meta_data->>'referrer_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Parte B: Corrigir organization_id que podem ter ficado nulos ou errados por falta de fallback
UPDATE public.user_profiles 
SET organization_id = '512f9aeb-683a-49c0-9731-76a7c8d10e8d' 
WHERE organization_id IS NULL;

-- Parte C: Sincronizar sponsor_id com referrer_id se estiver desalinhado
UPDATE public.user_profiles 
SET sponsor_id = referrer_id 
WHERE sponsor_id IS NULL AND referrer_id IS NOT NULL;
