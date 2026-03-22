-- Garantir que a coluna referrer_id existe no user_profiles
ALTER TABLE IF EXISTS public.user_profiles
ADD COLUMN IF NOT EXISTS referrer_id UUID;

-- Atualizar/Criar a função de gatilho que copia os dados do novo usuário autenticado para public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    organization_id, 
    referrer_id, 
    full_name, 
    nome, 
    sobrenome, 
    whatsapp, 
    cpf, 
    login,
    city,
    pix_key
  )
  VALUES (
    new.id,
    new.email,
    NULLIF(new.raw_user_meta_data->>'organization_id', '')::uuid,
    NULLIF(new.raw_user_meta_data->>'referrer_id', '')::uuid,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'nome',
    new.raw_user_meta_data->>'sobrenome',
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'login',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'pix_key'
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    referrer_id = EXCLUDED.referrer_id,
    full_name = EXCLUDED.full_name,
    nome = EXCLUDED.nome,
    sobrenome = EXCLUDED.sobrenome,
    whatsapp = EXCLUDED.whatsapp,
    cpf = EXCLUDED.cpf,
    login = EXCLUDED.login,
    city = EXCLUDED.city,
    pix_key = EXCLUDED.pix_key;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger está anexado à auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- IMPORTANTE: Para usuários que JÁ ESTÃO cadastrados mas não apareceram na rede por falta do referrer_id,
-- e se tivermos o indicativo via metadata no auth.users, podemos rodar esse update de recuperação:
UPDATE public.user_profiles up
SET referrer_id = CAST(au.raw_user_meta_data->>'referrer_id' AS UUID)
FROM auth.users au
WHERE up.id = au.id
AND up.referrer_id IS NULL
AND au.raw_user_meta_data->>'referrer_id' IS NOT NULL;
