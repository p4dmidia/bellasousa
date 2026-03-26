-- 1. Função de bônus robusta (Baseada no Comprador)
CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_item JSONB;
    v_product RECORD;
    v_buyer_id UUID;
    v_current_affiliate_id UUID;
    v_profile RECORD;
    v_level_commissions JSONB; 
    v_commission_amount DECIMAL(12,2);
    v_commission_value DECIMAL(12,2);
    v_is_fixed BOOLEAN;
    v_leadership_bonus_config JSONB;
    v_rank_config RECORD;
    v_new_rank TEXT;
    v_total_order_commission DECIMAL(12,2) := 0;
    v_total_order_leadership DECIMAL(12,2) := 0;
    v_item_total DECIMAL(12,2);
    v_commission_type TEXT;
    v_current_rank TEXT;
    v_network_depth INT;
BEGIN
    -- Só processa se o status mudar para 'completed'
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        
        -- Prevenir execução duplicada
        IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE order_id = NEW.id AND type = 'commission') THEN
            RETURN NEW;
        END IF;

        -- 1. Buscar configurações do site
        SELECT level_commissions, network_depth, commission_type, leadership_bonus_config 
        INTO v_level_commissions, v_network_depth, v_commission_type, v_leadership_bonus_config
        FROM public.site_configs 
        WHERE organization_id = NEW.organization_id 
        LIMIT 1;

        -- Fallback 
        v_network_depth := COALESCE(v_network_depth, 5);
        IF v_level_commissions IS NULL THEN
            v_level_commissions := '["0", "10", "5", "20", "5"]'::JSONB;
        END IF;
        v_is_fixed := (v_commission_type = 'fixed');

        -- IDENTIFICAR O COMPRADOR (Ele é o Nível 1 da rede)
        -- Tenta pelo contato, se não encontrar usa o affiliate_id como fallback (muitos casos o comprador é o próprio afiliado)
        SELECT id INTO v_buyer_id FROM public.user_profiles 
        WHERE (email = NEW.email AND NEW.email IS NOT NULL AND NEW.email != '')
           OR (whatsapp = NEW.whatsapp AND NEW.whatsapp IS NOT NULL AND NEW.whatsapp != '') 
        LIMIT 1;

        IF v_buyer_id IS NULL THEN
            v_buyer_id := NEW.affiliate_id;
        END IF;

        -- Se ainda não tiver ID, sai (não tem rede)
        IF v_buyer_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- 2. Loop nos itens do pedido
        FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            SELECT is_leadership_item INTO v_product FROM public.products WHERE id = (v_item->>'id')::UUID;
            v_item_total := (v_item->>'price')::DECIMAL * (v_item->>'quantity')::INT;

            -- Inicia a rede pelo comprador
            v_current_affiliate_id := v_buyer_id;

            -- 3. Loop Multinível (j=0 é o comprador, j=1 é o indicador dele)
            FOR j IN 0..(v_network_depth - 1) LOOP
                EXIT WHEN v_current_affiliate_id IS NULL;
                
                SELECT id, rank, balance, total_earnings, monthly_commission_total, leadership_bonus_total, referrer_id, sponsor_id 
                INTO v_profile FROM public.user_profiles WHERE id = v_current_affiliate_id;
                
                v_current_rank := COALESCE(v_profile.rank, 'Consultor');
                v_commission_amount := 0;

                -- REGRA: COMPRADOR (NÍVEL 1) NÃO GANHA NADA
                IF v_current_affiliate_id = v_buyer_id THEN
                    v_commission_amount := 0;
                ELSE
                    -- REGRA DE LEADERSHIP
                    IF COALESCE(v_product.is_leadership_item, false) THEN
                        -- Paga o % da patente de quem está recebendo
                        FOR v_rank_config IN SELECT * FROM jsonb_to_recordset(v_leadership_bonus_config) AS x(name text, percentage numeric) LOOP
                            IF LOWER(v_rank_config.name) = LOWER(v_current_rank) THEN
                                v_commission_amount := v_item_total * (v_rank_config.percentage / 100);
                                EXIT;
                            END IF;
                        END LOOP;
                    ELSE
                        -- REGRA MMN PADRÃO
                        v_commission_value := (v_level_commissions->>j)::NUMERIC;
                        IF v_is_fixed THEN
                            v_commission_amount := v_commission_value * (v_item->>'quantity')::INT;
                        ELSE
                            v_commission_amount := v_item_total * (v_commission_value / 100);
                        END IF;
                    END IF;
                END IF;

                -- Respeita o 0 configurado (se já for 0, pula)
                IF v_commission_amount > 0 THEN
                    UPDATE public.user_profiles SET
                        balance = COALESCE(balance, 0) + v_commission_amount,
                        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
                        leadership_bonus_total = CASE WHEN COALESCE(v_product.is_leadership_item, false) THEN COALESCE(leadership_bonus_total, 0) + v_commission_amount ELSE leadership_bonus_total END,
                        monthly_commission_total = COALESCE(monthly_commission_total, 0) + v_commission_amount
                    WHERE id = v_current_affiliate_id;

                    INSERT INTO public.wallet_transactions (user_id, amount, type, description, order_id)
                    VALUES (v_current_affiliate_id, v_commission_amount, 'commission', 
                        CASE WHEN COALESCE(v_product.is_leadership_item, false) 
                            THEN 'Bônus Liderança Nível ' || (j+1) || ' (' || v_current_rank || ') - Pedido #' || NEW.payment_id
                            ELSE 'Comissão MMN Nível ' || (j+1) || ' - Pedido #' || NEW.payment_id
                        END, NEW.id);
                    
                    IF COALESCE(v_product.is_leadership_item, false) THEN
                        v_total_order_leadership := v_total_order_leadership + v_commission_amount;
                    ELSE
                        v_total_order_commission := v_total_order_commission + v_commission_amount;
                    END IF;

                    -- Atualização de Rank se atingir meta
                    v_new_rank := v_current_rank;
                    FOR v_rank_config IN SELECT * FROM jsonb_to_recordset(v_leadership_bonus_config) AS x(name TEXT, threshold DECIMAL) ORDER BY threshold DESC 
                    LOOP
                        IF (COALESCE(v_profile.monthly_commission_total, 0) + v_commission_amount) >= v_rank_config.threshold THEN
                            v_new_rank := v_rank_config.name;
                            EXIT;
                        END IF;
                    END LOOP;
                    IF v_new_rank != v_current_rank THEN
                        UPDATE public.user_profiles SET rank = v_new_rank WHERE id = v_current_affiliate_id;
                    END IF;
                END IF;

                -- Sobe na rede: o próximo é o indicador de quem acabou de ser processado
                v_current_affiliate_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
            END LOOP;
        END LOOP;

        UPDATE public.orders SET 
            commission_amount = COALESCE(v_total_order_commission, 0), 
            leadership_bonus_amount = COALESCE(v_total_order_leadership, 0)
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
