-- 1. Identificar e corrigir usuários vinculados a indicadores de outras organizações
-- Isso resolve o problema onde o banco compartilhado permitia indicações cruzadas

-- Criar um log temporário das correções
CREATE TEMP TABLE corrections_log AS
SELECT 
    u.id, 
    u.email, 
    u.organization_id as user_org, 
    r.organization_id as referrer_org,
    u.referrer_id,
    u.full_name
FROM public.user_profiles u
JOIN public.user_profiles r ON u.referrer_id = r.id
WHERE u.organization_id != r.organization_id;

-- Aplicar a correção: Remover referrer_id se for de outra organização
UPDATE public.user_profiles u
SET 
    referrer_id = NULL,
    sponsor_id = NULL
FROM public.user_profiles r
WHERE u.referrer_id = r.id 
AND u.organization_id != r.organization_id;

-- 2. Correção específica para Paula Gonçalves
-- Caso ela precise ser vinculada a alguém específico da Bela Sousa, ajustar aqui.
-- Por enquanto, garantimos que ela não esteja vinculada ao Weider (Classe A).
UPDATE public.user_profiles
SET referrer_id = NULL, sponsor_id = NULL
WHERE email = 'paulagoncalves@gmail.com'
AND (SELECT organization_id FROM public.user_profiles WHERE id = referrer_id) != organization_id;

-- 3. Mostrar resultados
SELECT * FROM corrections_log;
