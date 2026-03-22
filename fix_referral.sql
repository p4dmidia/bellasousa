-- 1. Garantir que o referrer_id está criado
ALTER TABLE IF EXISTS public.user_profiles
ADD COLUMN IF NOT EXISTS referrer_id UUID;

-- 2. Atualizar o gatilho verificando apenas as colunas que realmente existem na sua base!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
    NULLIF(new.raw_user_meta_data->>'referrer_id', '')::uuid,
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
UPDATE public.user_profiles up
SET referrer_id = CAST(au.raw_user_meta_data->>'referrer_id' AS UUID)
FROM auth.users au
WHERE up.id = au.id
AND up.referrer_id IS NULL
AND au.raw_user_meta_data->>'referrer_id' IS NOT NULL;
