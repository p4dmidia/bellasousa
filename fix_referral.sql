-- 1. Garantir que o referrer_id está criado
ALTER TABLE IF EXISTS public.user_profiles
ADD COLUMN IF NOT EXISTS referrer_id UUID;

-- 2. Atualizar o gatilho verificando apenas as colunas que realmente existem na sua base!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_ref_id UUID;
  v_meta_ref TEXT;
BEGIN
  v_meta_ref := NULLIF(new.raw_user_meta_data->>'referrer_id', '');
  
  -- Se for um UUID válido, usa direto
  IF v_meta_ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_ref_id := v_meta_ref::UUID;
  ELSIF v_meta_ref IS NOT NULL THEN
    -- Tenta buscar por Login ou Email como fallback
    SELECT id INTO v_ref_id 
    FROM public.user_profiles 
    WHERE login = v_meta_ref OR email = v_meta_ref
    LIMIT 1;
  END IF;

  INSERT INTO public.user_profiles (
    id, 
    email, 
    organization_id, 
    referrer_id, 
    cpf, 
    login
  )
  VALUES (
    new.id,
    new.email,
    NULLIF(new.raw_user_meta_data->>'organization_id', '')::uuid,
    v_ref_id,
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'login'
  )
  ON CONFLICT (id) DO UPDATE SET
    referrer_id = EXCLUDED.referrer_id,
    cpf = EXCLUDED.cpf,
    login = EXCLUDED.login;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir recriação correta do gatilho
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. O mais importante: Recuperar as contas que já foram criadas sem entrar na rede!
-- Tenta primeiro por UUID direto
UPDATE public.user_profiles up
SET referrer_id = (au.raw_user_meta_data->>'referrer_id')::UUID
FROM auth.users au
WHERE up.id = au.id
AND up.referrer_id IS NULL
AND au.raw_user_meta_data->>'referrer_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Tenta recuperar quem usou LOGIN ou EMAIL como indicação
UPDATE public.user_profiles up
SET referrer_id = referrer_ref.id
FROM auth.users au
JOIN public.user_profiles referrer_ref ON (
    referrer_ref.login = au.raw_user_meta_data->>'referrer_id' OR 
    referrer_ref.email = au.raw_user_meta_data->>'referrer_id'
)
WHERE up.id = au.id
AND up.referrer_id IS NULL
AND au.raw_user_meta_data->>'referrer_id' IS NOT NULL
AND au.raw_user_meta_data->>'referrer_id' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
