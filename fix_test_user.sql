-- Correção manual do usuário de teste 'n2' que estava com link quebrado
UPDATE public.user_profiles 
SET referrer_id = '722c437c-0352-4a80-9770-97c4a716e1f6' 
WHERE email = 'n2@gmail.com';
