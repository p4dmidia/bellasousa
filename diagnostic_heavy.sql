-- DIAGNÓSTICO PESADO: Vai travar QUALQUER update na tabela de pedidos
-- Garante que o trigger antigo não está interferindo
DROP TRIGGER IF EXISTS tr_process_mmn_commissions ON public.orders;

CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_login TEXT;
    v_ref_login TEXT;
BEGIN
    -- Buscar logins para facilitar leitura humana
    SELECT login INTO v_buyer_login FROM public.user_profiles WHERE id = NEW.affiliate_id;
    SELECT login INTO v_ref_login FROM public.user_profiles WHERE id = NEW.referrer_id;
    
    -- TRAVAR TUDO E MOSTRAR DADOS
    RAISE EXCEPTION 'ID-DO-PEDIDO: %, NOVO-STATUS: %, COMPRADOR: % (ID:%), INDICADOR-NO-PEDIDO: % (ID:%)', 
        NEW.id, NEW.status, v_buyer_login, NEW.affiliate_id, v_ref_login, NEW.referrer_id;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_process_mmn_commissions
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_process_mmn_commissions();
