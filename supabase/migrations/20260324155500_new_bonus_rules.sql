-- 1. Função de processamento de bônus (VERSÃO COM DETALHAMENTO DE COMPRADOR)
CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_item JSONB;
    v_product RECORD;
    v_current_affiliate_id UUID;
    v_profile RECORD;
    v_level INT;
    v_level_commissions JSONB;
    v_commission_amount DECIMAL(12,2);
    v_commission_value DECIMAL(12,2);
    v_is_fixed BOOLEAN;
    v_leadership_bonus_config JSONB;
    v_rank_config RECORD;
    v_new_rank TEXT;
    v_total_order_commission DECIMAL(12,2) := 0;
    v_total_order_leadership DECIMAL(12,2) := 0;
    v_target_rank TEXT;
    v_has_mmn_item BOOLEAN := false;
    v_customer_name TEXT := 'Cliente';
BEGIN
    PERFORM public.fn_reset_monthly_commissions();

    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE order_id = NEW.id AND type = 'commission') THEN
            RETURN NEW;
        END IF;

        -- Buscar Nome do Comprador (Campos reais da tabela orders)
        v_customer_name := COALESCE(NEW.customer_name, NEW.nome, 'Cliente');

        SELECT level_commissions, commission_type, leadership_bonus_config 
        INTO v_config 
        FROM public.site_configs 
        WHERE organization_id = NEW.organization_id 
        LIMIT 1;

        v_level_commissions := COALESCE(v_config.level_commissions, '["10", "5", "3", "1"]'::JSONB);
        v_is_fixed := (v_config.commission_type = 'fixed');
        v_leadership_bonus_config := COALESCE(v_config.leadership_bonus_config, '[]'::JSONB);

        FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            SELECT id, is_leadership_item, price, stock_quantity INTO v_product 
            FROM public.products 
            WHERE id::text = (v_item->>'id') OR name = (v_item->>'name')
            LIMIT 1;

            IF v_product IS NULL THEN CONTINUE; END IF;

            UPDATE public.products 
            SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - (v_item->>'quantity')::INT)
            WHERE id = v_product.id;

            IF v_product.is_leadership_item THEN
                IF NEW.affiliate_id IS NOT NULL THEN
                    SELECT rank INTO v_profile FROM public.user_profiles WHERE id = NEW.affiliate_id;
                    v_target_rank := COALESCE(v_profile.rank, 'Consultor');
                    IF v_target_rank = 'Consultor' OR v_target_rank = '' THEN
                        v_target_rank := 'Bronze';
                    END IF;
                    
                    v_commission_amount := 0;
                    FOR v_rank_config IN SELECT * FROM jsonb_to_recordset(v_leadership_bonus_config) AS x(name TEXT, threshold DECIMAL, percentage DECIMAL) LOOP
                        IF LOWER(v_target_rank) = LOWER(v_rank_config.name) THEN
                            v_commission_amount := ((v_item->>'price')::DECIMAL * (v_item->>'quantity')::INT) * (v_rank_config.percentage / 100);
                            EXIT;
                        END IF;
                    END LOOP;

                    IF v_commission_amount > 0 THEN
                        UPDATE public.user_profiles SET
                            balance = COALESCE(balance, 0) + v_commission_amount,
                            total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
                            monthly_commission_total = COALESCE(monthly_commission_total, 0) + v_commission_amount
                        WHERE id = NEW.affiliate_id;

                        INSERT INTO public.wallet_transactions (user_id, order_id, amount, type, description)
                        VALUES (NEW.affiliate_id, NEW.id, v_commission_amount, 'commission', 'Bônus Liderança (' || v_target_rank || ') - Venda de ' || v_customer_name || ' (' || (v_item->>'name') || ')');
                        
                        v_total_order_leadership := v_total_order_leadership + v_commission_amount;
                    END IF;
                END IF;
            ELSE
                v_has_mmn_item := true;
                v_current_affiliate_id := NEW.affiliate_id;
                FOR v_level IN 0..(JSONB_ARRAY_LENGTH(v_level_commissions) - 1) LOOP
                    EXIT WHEN v_current_affiliate_id IS NULL;
                    SELECT id, referrer_id, sponsor_id INTO v_profile FROM public.user_profiles WHERE id = v_current_affiliate_id;
                    IF v_profile IS NULL THEN EXIT; END IF;
                    v_commission_value := (v_level_commissions->>v_level)::DECIMAL;
                    IF v_is_fixed THEN
                        v_commission_amount := v_commission_value * (v_item->>'quantity')::INT;
                    ELSE
                        v_commission_amount := ((v_item->>'price')::DECIMAL * (v_item->>'quantity')::INT) * (v_commission_value / 100);
                    END IF;
                    UPDATE public.user_profiles SET
                        balance = COALESCE(balance, 0) + v_commission_amount,
                        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
                        monthly_commission_total = COALESCE(monthly_commission_total, 0) + v_commission_amount
                    WHERE id = v_current_affiliate_id;
                    
                    INSERT INTO public.wallet_transactions (user_id, order_id, amount, type, description)
                    VALUES (v_current_affiliate_id, NEW.id, v_commission_amount, 'commission', 'Comissão MMN Nível ' || (v_level + 1) || ' - Venda de ' || v_customer_name || ' (' || (v_item->>'name') || ')');
                    
                    IF v_level = 0 THEN v_total_order_commission := v_total_order_commission + v_commission_amount; END IF;
                    v_current_affiliate_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
                END LOOP;
            END IF;
        END LOOP;

        -- Ativação Mensal via e-mail do comprador
        IF v_has_mmn_item AND NEW.email IS NOT NULL THEN
            UPDATE public.user_profiles SET last_activation_at = now() WHERE email = NEW.email;
        END IF;

        IF NEW.affiliate_id IS NOT NULL THEN
            SELECT monthly_commission_total, rank INTO v_profile FROM public.user_profiles WHERE id = NEW.affiliate_id;
            v_new_rank := COALESCE(v_profile.rank, 'Consultor');
            FOR v_rank_config IN 
                SELECT * FROM jsonb_to_recordset(v_leadership_bonus_config) 
                AS x(name TEXT, threshold DECIMAL, percentage DECIMAL) 
                ORDER BY threshold DESC 
            LOOP
                IF v_profile.monthly_commission_total >= v_rank_config.threshold THEN
                    v_new_rank := v_rank_config.name;
                    EXIT;
                END IF;
            END LOOP;
            IF v_new_rank != COALESCE(v_profile.rank, '') THEN
                UPDATE public.user_profiles SET rank = v_new_rank WHERE id = NEW.affiliate_id;
            END IF;
        END IF;

        UPDATE public.orders SET commission_amount = v_total_order_commission, leadership_bonus_amount = v_total_order_leadership WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
