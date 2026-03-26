-- 1. Gatilho com logs VERBOSOS
CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_item JSONB;
    v_prod_is_leadership BOOLEAN;
    v_buyer_id UUID;
    v_curr UUID;
    v_profile RECORD;
    v_comm_list JSONB; 
    v_amt DECIMAL(12,2);
    v_val DECIMAL(12,2);
    v_rank_config JSONB;
    v_r RECORD;
    v_total DECIMAL(12,2) := 0;
    v_depth INT;
    v_qty INT;
    v_price DECIMAL(12,2);
BEGIN
    INSERT INTO public.mmn_audit (order_id, step, message) VALUES (NEW.id::text, 'INÍCIO', 'Org: ' || NEW.organization_id);

    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        
        IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE order_id = NEW.id) THEN
            INSERT INTO public.mmn_audit (order_id, step, message) VALUES (NEW.id::text, 'PULO', 'Transação já existe');
            RETURN NEW;
        END IF;

        SELECT level_commissions, network_depth, leadership_bonus_config 
        INTO v_comm_list, v_depth, v_rank_config
        FROM public.site_configs WHERE organization_id = NEW.organization_id LIMIT 1;

        -- Identificar Comprador
        SELECT id INTO v_buyer_id FROM public.user_profiles 
        WHERE (email ILIKE NEW.email AND NEW.email IS NOT NULL AND NEW.email != '')
           OR (whatsapp = NEW.whatsapp AND NEW.whatsapp IS NOT NULL AND NEW.whatsapp != '') 
        LIMIT 1;

        IF v_buyer_id IS NULL THEN v_buyer_id := NEW.affiliate_id; END IF;
        
        INSERT INTO public.mmn_audit (order_id, step, message) 
        VALUES (NEW.id::text, 'CONFIG', 'Comms: ' || v_comm_list::text || ' Depth: ' || v_depth);

        FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            SELECT is_leadership_item INTO v_prod_is_leadership FROM public.products WHERE id = (v_item->>'id')::UUID;
            
            -- Debug de chaves do JSON
            v_qty := COALESCE((v_item->>'quantity')::INT, (v_item->>'qtd')::INT, 1);
            v_price := COALESCE((v_item->>'price')::DECIMAL, (v_item->>'valor')::DECIMAL, 0);

            INSERT INTO public.mmn_audit (order_id, step, message) 
            VALUES (NEW.id::text, 'ITEM', 'Qty: ' || v_qty || ' Price: ' || v_price || ' Liderança: ' || COALESCE(v_prod_is_leadership, false));

            v_curr := v_buyer_id;
            FOR j IN 0..(COALESCE(v_depth, 5) - 1) LOOP
                EXIT WHEN v_curr IS NULL;
                
                SELECT id, rank, referrer_id, sponsor_id INTO v_profile FROM public.user_profiles WHERE id = v_curr;
                v_amt := 0;
                v_val := 0;

                IF v_curr != v_buyer_id THEN
                    IF COALESCE(v_prod_is_leadership, false) THEN
                        FOR v_r IN SELECT * FROM jsonb_to_recordset(v_rank_config) AS x(name text, percentage numeric) LOOP
                            IF LOWER(v_r.name) = LOWER(COALESCE(v_profile.rank, 'Consultor')) THEN
                                v_val := v_r.percentage;
                                v_amt := (v_price * v_qty) * (v_val / 100);
                                EXIT;
                            END IF;
                        END LOOP;
                    ELSE
                        v_val := (v_comm_list->>j)::NUMERIC;
                        v_amt := (v_price * v_qty) * (v_val / 100);
                    END IF;
                END IF;

                INSERT INTO public.mmn_audit (order_id, step, message) 
                VALUES (NEW.id::text, 'NÍVEL ' || j, 'ID: ' || v_curr::text || ' Rank: ' || COALESCE(v_profile.rank, '?') || ' %: ' || v_val || ' Ganho: ' || v_amt);

                IF v_amt > 0 THEN
                    UPDATE public.user_profiles SET
                        balance = COALESCE(balance, 0) + v_amt,
                        total_earnings = COALESCE(total_earnings, 0) + v_amt,
                        monthly_commission_total = COALESCE(monthly_commission_total, 0) + v_amt
                    WHERE id = v_curr;

                    INSERT INTO public.wallet_transactions (user_id, amount, type, description, order_id)
                    VALUES (v_curr, v_amt, 'commission', 'Comissão Nível ' || (j+1) || ' - Pedido #' || NEW.payment_id, NEW.id);
                    v_total := v_total + v_amt;
                END IF;

                v_curr := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
            END LOOP;
        END LOOP;

        UPDATE public.orders SET commission_amount = v_total WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
