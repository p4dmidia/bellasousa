-- 0. Garantir colunas financeiras
ALTER TABLE IF EXISTS public.user_profiles 
ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12,2) DEFAULT 0;

-- 1. Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT CHECK (type IN ('commission', 'bonus', 'withdrawal')),
    description TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order ON public.wallet_transactions(order_id);

-- 2. Create the Trigger Function to process MMN
CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_current_affiliate_id UUID;
    v_parent_id UUID;
    v_level INT := 0;
    v_level_commissions JSONB;
    v_is_fixed BOOLEAN;
    v_order_amount DECIMAL(12,2);
    v_commission_value DECIMAL(12,2);
    v_commission_amount DECIMAL(12,2);
    v_profile RECORD;
    v_leadership_bonus_config JSONB;
    v_new_total_sales DECIMAL(12,2);
    v_leadership_bonus DECIMAL(12,2);
    v_new_rank TEXT;
    v_rank_config RECORD;
    v_affiliate_login TEXT;
BEGIN
    -- Only run when status changes to 'completed'
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        
        -- Get configuration for the organization
        -- Fallback: Use the organization_id from the affiliate if not present in the order
        DECLARE
           v_target_org_id UUID := COALESCE(NEW.organization_id, (SELECT organization_id FROM public.user_profiles WHERE id = NEW.affiliate_id));
        BEGIN
            SELECT level_commissions, commission_type, leadership_bonus_config 
            INTO v_config 
            FROM public.site_configs 
            WHERE organization_id = v_target_org_id 
            LIMIT 1;
        END;

        IF v_config IS NULL THEN
            -- Default fallbacks
            RAISE NOTICE 'fn_process_mmn_commissions: Configuration NOT found for org %, using defaults.', COALESCE(NEW.organization_id::TEXT, 'NULL');
            v_level_commissions := '["10", "5", "3", "1"]'::JSONB;
            v_is_fixed := FALSE;
            v_leadership_bonus_config := '[]'::JSONB;
        ELSE
            v_level_commissions := COALESCE(v_config.level_commissions, '["10", "5", "3", "1"]'::JSONB);
            v_is_fixed := (COALESCE(v_config.commission_type, 'percentage') = 'fixed');
            v_leadership_bonus_config := COALESCE(v_config.leadership_bonus_config, '[]'::JSONB);
        END IF;

        v_order_amount := NEW.total_amount;
        v_current_affiliate_id := NEW.affiliate_id;

        -- Check if commissions were already processed for this order to avoid double payment
        IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE order_id = NEW.id AND type = 'commission') THEN
            RETURN NEW;
        END IF;

        -- Loop up the hierarchy
        FOR v_level IN 0..(JSONB_ARRAY_LENGTH(v_level_commissions) - 1) LOOP
            EXIT WHEN v_current_affiliate_id IS NULL;

            -- Fetch current level profile
            SELECT id, balance, total_earnings, total_sales, rank, login, referrer_id, sponsor_id 
            INTO v_profile 
            FROM public.user_profiles 
            WHERE id = v_current_affiliate_id;

            IF v_profile IS NULL THEN
                EXIT;
            END IF;

            -- Calculate Commission
            v_commission_value := (v_level_commissions->>v_level)::DECIMAL;
            IF v_is_fixed THEN
                v_commission_amount := v_commission_value;
            ELSE
                v_commission_amount := v_order_amount * (v_commission_value / 100);
            END IF;

            -- Leadership Bonus logic
            v_new_total_sales := COALESCE(v_profile.total_sales, 0) + v_order_amount;
            v_leadership_bonus := 0;
            v_new_rank := v_profile.rank;

            -- Dynamic Rank Check
            FOR v_rank_config IN SELECT * FROM jsonb_to_recordset(v_leadership_bonus_config) AS x(name TEXT, threshold DECIMAL, percentage DECIMAL) ORDER BY threshold DESC LOOP
                IF v_new_total_sales >= v_rank_config.threshold THEN
                    IF v_is_fixed THEN
                        v_leadership_bonus := v_rank_config.percentage;
                    ELSE
                        v_leadership_bonus := v_order_amount * (v_rank_config.percentage / 100);
                    END IF;
                    v_new_rank := v_rank_config.name;
                    EXIT; -- Found highest rank
                END IF;
            END LOOP;

            -- Update Profile
            UPDATE public.user_profiles SET
                balance = COALESCE(balance, 0) + v_commission_amount + v_leadership_bonus,
                total_earnings = COALESCE(total_earnings, 0) + v_commission_amount + v_leadership_bonus,
                total_sales = v_new_total_sales,
                rank = COALESCE(v_new_rank, rank)
            WHERE id = v_profile.id;

            -- Sync primary commission to orders table for Level 0
            IF v_level = 0 THEN
                UPDATE public.orders SET 
                   commission_amount = v_commission_amount,
                   leadership_bonus_amount = v_leadership_bonus
                WHERE id = NEW.id;
            END IF;

            -- Create Transaction History Record
            INSERT INTO public.wallet_transactions (user_id, order_id, amount, type, description)
            VALUES (
                v_profile.id, 
                NEW.id, 
                v_commission_amount + v_leadership_bonus, 
                'commission',
                'Comissão Nível ' || (v_level + 1) || ' - Pedido #' || SUBSTR(NEW.id::TEXT, 1, 8)
            );

            -- Move up to parent
            v_current_affiliate_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger
DROP TRIGGER IF EXISTS tr_process_mmn_commissions ON public.orders;
CREATE TRIGGER tr_process_mmn_commissions
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_process_mmn_commissions();
