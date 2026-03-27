-- Fix Commission Logic: MMN vs Leadership Bonus
-- 1. If product is is_leadership_item = true:
--    - Pay ONLY leadership bonus (rank-based).
--    - Consultor = Bronze.
--    - No self-payment.
-- 2. If product is is_leadership_item = false:
--    - Pay ONLY MMN commission.
-- 3. Respect network depth.

CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_id UUID;
    v_curr_affiliate_id UUID;
    v_profile RECORD;
    v_config RECORD;
    v_level_commissions JSONB;
    v_leadership_config JSONB;
    v_depth INT;
    v_item JSONB;
    v_prod_record RECORD;
    v_qty INT;
    v_price DECIMAL(12,2);
    v_item_total DECIMAL(12,2);
    v_comm_val DECIMAL(12,2);
    v_amt DECIMAL(12,2);
    v_total_commission DECIMAL(12,2) := 0;
    v_rank_for_bonus TEXT;
    v_r RECORD;
BEGIN
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        SELECT level_commissions, network_depth, leadership_bonus_config 
        INTO v_config 
        FROM public.site_configs 
        WHERE organization_id = NEW.organization_id 
        LIMIT 1;

        v_level_commissions := COALESCE(v_config.level_commissions, '["10", "5", "3", "2", "1"]'::JSONB);
        v_depth := COALESCE(v_config.network_depth, JSONB_ARRAY_LENGTH(v_level_commissions));
        v_leadership_config := COALESCE(v_config.leadership_bonus_config, '[]'::JSONB);

        SELECT id INTO v_buyer_id FROM public.user_profiles 
        WHERE (email ILIKE NEW.email AND NEW.email IS NOT NULL AND NEW.email != '')
           OR (whatsapp = NEW.whatsapp AND NEW.whatsapp IS NOT NULL AND NEW.whatsapp != '') 
        LIMIT 1;

        IF v_buyer_id IS NULL THEN v_buyer_id := NEW.affiliate_id; END IF;

        FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            SELECT is_leadership_item, price INTO v_prod_record FROM public.products WHERE id = (v_item->>'id')::UUID;
            
            v_qty := COALESCE((v_item->>'quantity')::INT, (v_item->>'qtd')::INT, 1);
            v_price := COALESCE((v_item->>'price')::DECIMAL, v_prod_record.price, 0);
            v_item_total := v_qty * v_price;

            v_curr_affiliate_id := v_buyer_id;

            FOR j in 0..(v_depth - 1) LOOP
                EXIT WHEN v_curr_affiliate_id IS NULL;
                SELECT id, rank, referrer_id, sponsor_id INTO v_profile FROM public.user_profiles WHERE id = v_curr_affiliate_id;
                
                v_amt := 0;
                v_comm_val := 0;

                IF v_curr_affiliate_id != v_buyer_id THEN
                    IF COALESCE(v_prod_record.is_leadership_item, false) THEN
                        v_rank_for_bonus := COALESCE(v_profile.rank, 'Consultor');
                        IF LOWER(v_rank_for_bonus) = 'consultor' THEN v_rank_for_bonus := 'Bronze'; END IF;

                        FOR v_r IN SELECT * FROM jsonb_to_recordset(v_leadership_config) AS x(name text, percentage numeric) LOOP
                            IF LOWER(v_r.name) = LOWER(v_rank_for_bonus) THEN
                                v_comm_val := v_r.percentage;
                                v_amt := v_item_total * (v_comm_val / 100);
                                EXIT;
                            END IF;
                        END LOOP;
                    ELSE
                        IF j < JSONB_ARRAY_LENGTH(v_level_commissions) THEN
                            v_comm_val := (v_level_commissions->>j)::NUMERIC;
                            v_amt := v_item_total * (v_comm_val / 100);
                        END IF;
                    END IF;
                END IF;

                IF v_amt > 0 THEN
                    UPDATE public.user_profiles SET
                        balance = COALESCE(balance, 0) + v_amt,
                        total_earnings = COALESCE(total_earnings, 0) + v_amt,
                        monthly_commission_total = COALESCE(monthly_commission_total, 0) + v_amt
                    WHERE id = v_curr_affiliate_id;

                    INSERT INTO public.wallet_transactions (user_id, amount, type, description, order_id)
                    VALUES (v_curr_affiliate_id, v_amt, 'commission', 
                           'Comissão ' || (CASE WHEN v_prod_record.is_leadership_item THEN 'Liderança' ELSE ('Nível ' || (j+1)) END) || 
                           ' - Item: ' || (v_item->>'name') || ' - Pedido #' || SUBSTR(NEW.id::TEXT, 1, 8), 
                           NEW.id);
                    
                    v_total_commission := v_total_commission + v_amt;
                END IF;

                v_curr_affiliate_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
            END LOOP;
        END LOOP;

        UPDATE public.orders SET commission_amount = v_total_commission WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
