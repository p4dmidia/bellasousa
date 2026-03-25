-- 1. Função de processamento de bônus (VERSÃO COM LOGS DE DEPURAÇÃO)
CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_item JSONB;
    v_product RECORD;
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
    v_target_rank TEXT;
    v_has_mmn_item BOOLEAN := false;
    v_customer_name TEXT := 'Cliente';
    v_item_total DECIMAL(12,2);
    v_commission_type TEXT;
    v_current_rank TEXT;
BEGIN
    -- Permitir processamento apenas quando o status muda para 'completed'
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        RAISE NOTICE 'Iniciando processamento de comissões para Pedido %', NEW.id;

        -- Prevenir execução duplicada
        IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE order_id = NEW.id AND type = 'commission') THEN
            RAISE NOTICE 'Comissões JÁ PROCESSADAS para o pedido %. Pulando.', NEW.id;
            RETURN NEW;
        END IF;

        -- Buscar Nome do Comprador
        v_customer_name := COALESCE(NEW.customer_name, NEW.nome, 'Cliente');

        -- Buscar configurações do site
        SELECT level_commissions, commission_type, leadership_bonus_config 
        INTO v_level_commissions, v_commission_type, v_leadership_bonus_config
        FROM public.site_configs 
        WHERE organization_id = NEW.organization_id 
        LIMIT 1;

        RAISE NOTICE 'Configurações carregadas: levels=%, type=%', v_level_commissions, v_commission_type;

        -- Fallback se não houver config
        IF v_level_commissions IS NULL THEN
            v_level_commissions := '["10", "5", "3", "1"]'::JSONB;
            RAISE NOTICE 'Usando fallback de comissão (10, 5, 3, 1)';
        END IF;
        v_is_fixed := (v_commission_type = 'fixed');

        -- Loop nos itens do pedido
        FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            -- Buscar informações do produto
            SELECT is_leadership_item INTO v_product FROM public.products WHERE id = (v_item->>'id')::UUID;
            v_item_total := (v_item->>'price')::DECIMAL * (v_item->>'quantity')::INT;
            
            RAISE NOTICE 'Item: %, Preço Total: %, Leadership: %', v_item->>'name', v_item_total, v_product.is_leadership_item;

            -- Iniciar cadeia a partir do indicador do comprador (Comprador pula - regra de afiliada)
            SELECT referrer_id, sponsor_id INTO v_profile FROM public.user_profiles WHERE id = NEW.affiliate_id;
            v_current_affiliate_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
            
            RAISE NOTICE 'Comprador: %, Indicador Inicial: %', NEW.affiliate_id, v_current_affiliate_id;

            -- Se for item de liderança, segue regra de rede de liderança
            IF COALESCE(v_product.is_leadership_item, false) THEN
                FOR i IN 0..(jsonb_array_length(v_level_commissions) - 1) LOOP
                    EXIT WHEN v_current_affiliate_id IS NULL;
                    
                    SELECT rank, referrer_id, sponsor_id INTO v_profile FROM public.user_profiles WHERE id = v_current_affiliate_id;
                    v_current_rank := COALESCE(v_profile.rank, 'Consultor');

                    v_commission_amount := 0;
                    -- Procura a porcentagem para o rank atual no config de liderança
                    FOR v_rank_config IN SELECT * FROM jsonb_to_recordset(v_leadership_bonus_config) AS x(name text, percentage numeric) LOOP
                        IF LOWER(v_rank_config.name) = LOWER(v_current_rank) THEN
                            v_commission_amount := v_item_total * (v_rank_config.percentage / 100);
                            EXIT;
                        END IF;
                    END LOOP;

                    -- Respeita o "0" no nível do MMN
                    v_commission_value := (v_level_commissions->>i)::NUMERIC;
                    IF v_commission_value = 0 THEN
                        v_commission_amount := 0;
                    END IF;
                    
                    RAISE NOTICE 'Liderança Nível % (rank %): valor=%', (i+1), v_current_rank, v_commission_amount;

                    IF v_commission_amount > 0 THEN
                        UPDATE public.user_profiles SET
                            balance = COALESCE(balance, 0) + v_commission_amount,
                            leadership_bonus_total = COALESCE(leadership_bonus_total, 0) + v_commission_amount
                        WHERE id = v_current_affiliate_id;

                        INSERT INTO public.wallet_transactions (user_id, amount, type, description, order_id)
                        VALUES (v_current_affiliate_id, v_commission_amount, 'commission', 'Bônus Liderança Nível ' || (i+1) || ' (' || v_current_rank || ') - Pedido #' || NEW.payment_id, NEW.id);
                        
                        v_total_order_leadership := v_total_order_leadership + v_commission_amount;
                    END IF;

                    v_current_affiliate_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
                END LOOP;
            ELSE
                -- Bônus MMN Padrão
                v_has_mmn_item := true;
                FOR i IN 0..(jsonb_array_length(v_level_commissions) - 1) LOOP
                    EXIT WHEN v_current_affiliate_id IS NULL;
                    
                    v_commission_value := (v_level_commissions->>i)::NUMERIC;
                    
                    IF v_is_fixed THEN
                        v_commission_amount := v_commission_value * (v_item->>'quantity')::INT;
                    ELSE
                        v_commission_amount := v_item_total * (v_commission_value / 100);
                    END IF;
                    
                    RAISE NOTICE 'MMN Nível %: config=%, valor=%', (i+1), v_commission_value, v_commission_amount;

                    IF v_commission_amount > 0 THEN
                        UPDATE public.user_profiles SET
                            balance = COALESCE(balance, 0) + v_commission_amount,
                            total_earnings = COALESCE(total_earnings, 0) + v_commission_amount
                        WHERE id = v_current_affiliate_id;

                        INSERT INTO public.wallet_transactions (user_id, amount, type, description, order_id)
                        VALUES (v_current_affiliate_id, v_commission_amount, 'commission', 'Comissão MMN Nível ' || (i+1) || ' - Pedido #' || NEW.payment_id, NEW.id);
                        
                        v_total_order_commission := v_total_order_commission + v_commission_amount;
                    END IF;

                    SELECT referrer_id, sponsor_id INTO v_profile FROM public.user_profiles WHERE id = v_current_affiliate_id;
                    v_current_affiliate_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
                END LOOP;
            END IF;
        END LOOP;

        -- Carreira
        IF NEW.affiliate_id IS NOT NULL THEN
            SELECT monthly_commission_total, rank INTO v_profile FROM public.user_profiles WHERE id = NEW.affiliate_id;
            v_new_rank := COALESCE(v_profile.rank, 'Consultor');
            FOR v_rank_config IN 
                SELECT * FROM jsonb_to_recordset(v_leadership_bonus_config) 
                AS x(name TEXT, threshold DECIMAL, percentage DECIMAL) 
                ORDER BY threshold DESC 
            LOOP
                IF COALESCE(v_profile.monthly_commission_total, 0) >= v_rank_config.threshold THEN
                    v_new_rank := v_rank_config.name;
                    EXIT;
                END IF;
            END LOOP;
            IF v_new_rank != COALESCE(v_profile.rank, '') THEN
                UPDATE public.user_profiles SET rank = v_new_rank WHERE id = NEW.affiliate_id;
            END IF;
        END IF;

        UPDATE public.orders SET 
            commission_amount = COALESCE(v_total_order_commission, 0), 
            leadership_bonus_amount = COALESCE(v_total_order_leadership, 0)
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Processamento concluído. MMN Total: %, Leadership Total: %', v_total_order_commission, v_total_order_leadership;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar Trigger
DROP TRIGGER IF EXISTS tr_process_mmn_commissions ON public.orders;
CREATE TRIGGER tr_process_mmn_commissions
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
EXECUTE FUNCTION public.fn_process_mmn_commissions();
