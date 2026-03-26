-- DIAGNÓSTICO: Esta versão vai dar um ERRO proposital no Painel para mostrar os IDs
CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_profile RECORD;
    v_indicator_id UUID;
BEGIN
    IF (NEW.status = 'completed') THEN
        -- Buscar quem indicou o comprador
        SELECT referrer_id, sponsor_id INTO v_profile FROM public.user_profiles WHERE id = NEW.affiliate_id;
        v_indicator_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
        
        -- LANÇAR ERRO COM AS INFOS PARA VERMOS NO TOAST
        RAISE EXCEPTION 'DEBUG: Comprador=%, Indicador=%, Referrer_no_Pedido=%', NEW.affiliate_id, v_indicator_id, NEW.referrer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
