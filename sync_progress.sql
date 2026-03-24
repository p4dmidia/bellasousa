-- Script de Sincronização de Progresso de Carreira
-- Este script atualiza o campo monthly_commission_total com base nas transações reais do mês atual.
-- Caminho sugerido: c:/Users/eu/Documents/P4D/Projetos/Bela sousa/sync_progress.sql

UPDATE user_profiles up
SET monthly_commission_total = (
  SELECT COALESCE(SUM(amount), 0)
  FROM wallet_transactions wt
  WHERE wt.user_id = up.id
    AND wt.created_at >= date_trunc('month', now())
    AND wt.amount > 0 -- Conta apenas as entradas (ganhos) de comissão
)
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM wallet_transactions 
  WHERE created_at >= date_trunc('month', now())
);

-- Verificar resultado para os top 5
SELECT id, login, balance, monthly_commission_total 
FROM user_profiles 
ORDER BY monthly_commission_total DESC 
LIMIT 5;
