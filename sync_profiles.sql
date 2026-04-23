-- 1. Garantir que as colunas existem no user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS login TEXT;

-- 2. Função para sincronizar dados do Auth para o Profile
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

  -- Resolução Robusta do Referrer (Indicador)
  IF v_referrer_code IS NOT NULL AND v_referrer_code <> '' THEN
    -- 1. Se já for um UUID válido, usa ele diretamente
    IF v_referrer_code ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_referrer_id := v_referrer_code::UUID;
    ELSE
      -- 2. Tenta buscar por e-mail ou login (Busca Global para ser multi-tenant friendly)
      -- Isso resolve o caso onde o frontend envia apenas o "código" (email/login)
      SELECT id INTO v_referrer_id 
      FROM public.user_profiles 
      WHERE (email ILIKE v_referrer_code OR login ILIKE v_referrer_code)
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
    sponsor_id, -- Garantir que sponsor_id também seja preenchido
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
    v_referrer_id, -- No Bella Sousa, sponsor costuma ser o mesmo que referrer no cadastro
    'affiliate',
    NULL -- Começa inativo conforme regra
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp),
    login = COALESCE(EXCLUDED.login, user_profiles.login),
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    -- Prioriza a organização e indicador fornecidos no novo cadastro (EXCLUDED)
    -- Isso garante que se o usuário estiver "migrando" ou entrando em um novo sistema 
    -- compartilhado, ele seja vinculado à organização e rede corretas.
    organization_id = COALESCE(EXCLUDED.organization_id, user_profiles.organization_id),
    referrer_id = COALESCE(EXCLUDED.referrer_id, user_profiles.referrer_id),
    sponsor_id = COALESCE(EXCLUDED.sponsor_id, user_profiles.sponsor_id);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger para disparar na criação do Auth User
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sincronizar dados de usuários existentes (Opcional, mas recomendado)
UPDATE public.user_profiles p
SET 
  whatsapp = u.raw_user_meta_data->>'whatsapp',
  email = u.email,
  login = COALESCE(p.login, u.raw_user_meta_data->>'login', split_part(u.email, '@', 1))
FROM auth.users u
WHERE p.id = u.id AND (p.whatsapp IS NULL OR p.email IS NULL);
