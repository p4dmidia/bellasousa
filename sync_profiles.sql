-- 1. Garantir que as colunas existem no user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS login TEXT;

-- 2. Função para sincronizar dados do Auth para o Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    login, 
    whatsapp, 
    full_name, 
    organization_id, 
    referrer_id, 
    role,
    last_activation_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'organization_id')::UUID,
    (NEW.raw_user_meta_data->>'referrer_id')::UUID,
    'affiliate',
    NULL -- Começa inativo (cinza) conforme regra nova
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp),
    login = COALESCE(EXCLUDED.login, user_profiles.login),
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name);
    
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
