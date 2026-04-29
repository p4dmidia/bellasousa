-- MASTER SCHEMA FOR BELA SOUSA (Final Isolated Version)
-- Created: 2026-04-28

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES CLEANUP
DROP TRIGGER IF EXISTS tr_process_mmn_commissions ON public.orders;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.site_configs CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.mmn_audit CASCADE;

-- 3. TABLES

-- user_profiles 
-- NOTA: Removida temporariamente a referência a auth.users(id) para permitir a migração dos dados 
-- antes dos usuários serem importados/criados no novo projeto.
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY, -- REFERENCIARÁ auth.users(id) depois
    mocha_user_id text,
    cpf text,
    role text DEFAULT 'affiliate',
    is_active boolean DEFAULT true,
    sponsor_id uuid,
    company_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email text,
    organization_id uuid,
    avatar_url text,
    referrer_id uuid REFERENCES public.user_profiles(id),
    registration_type text,
    status text DEFAULT 'active',
    cnpj text,
    total_sales decimal(12,2) DEFAULT 0,
    rank text DEFAULT 'Consultor',
    leadership_bonus_total decimal(12,2) DEFAULT 0,
    login text,
    balance decimal(12,2) DEFAULT 0,
    total_earnings decimal(12,2) DEFAULT 0,
    monthly_commission_total decimal(12,2) DEFAULT 0,
    last_commission_reset timestamp with time zone,
    last_activation_at timestamp with time zone,
    whatsapp text,
    full_name text,
    city text,
    pix_key text,
    cep text,
    address text,
    street text,
    number text,
    complement text,
    neighborhood text,
    state text
);

-- site_configs
CREATE TABLE public.site_configs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), -- Alterado para UUID para bater com o banco antigo
    organization_id uuid UNIQUE,
    shop_name text DEFAULT 'Bella Sousa',
    commission_type text DEFAULT 'percentage',
    network_depth integer DEFAULT 5,
    level_commissions jsonb DEFAULT '["10", "5", "3", "2", "1"]'::jsonb,
    leadership_bonus_config jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- products
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    category_id integer DEFAULT 1,
    subcategory_id integer,
    price decimal(12,2) NOT NULL,
    stock_quantity integer DEFAULT 0,
    sales_count integer DEFAULT 0,
    image_url text,
    is_active boolean DEFAULT true,
    is_leadership_item boolean DEFAULT false,
    weight decimal(12,2),
    length decimal(12,2),
    width decimal(12,2),
    height decimal(12,2),
    origin_zip text,
    variations jsonb DEFAULT '[]'::jsonb,
    organization_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- orders
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id text,
    payment_preference_id text,
    payment_status text,
    payment_status_detail text,
    payment_method text,
    user_id uuid,
    affiliate_id uuid REFERENCES public.user_profiles(id),
    referrer_id uuid REFERENCES public.user_profiles(id),
    referral_code text,
    customer_name text,
    customer_email text,
    customer_phone text,
    customer_cpf text,
    shipping_address text,
    shipping_cost decimal(12,2) DEFAULT 0,
    shipping_method text,
    tracking_code text,
    total_amount decimal(12,2) NOT NULL,
    commission_amount decimal(12,2) DEFAULT 0,
    leadership_bonus_amount decimal(12,2) DEFAULT 0,
    status text DEFAULT 'pending',
    items jsonb DEFAULT '[]'::jsonb,
    pix_qr_code text,
    pix_qr_code_base64 text,
    pix_copy_paste text,
    organization_id uuid,
    email text,
    nome text,
    whatsapp text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- wallet_transactions
CREATE TABLE public.wallet_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    amount decimal(12,2) NOT NULL,
    type text CHECK (type IN ('commission', 'bonus', 'withdrawal')),
    description text,
    status text DEFAULT 'confirmed',
    created_at timestamp with time zone DEFAULT now()
);

-- mmn_audit
CREATE TABLE public.mmn_audit (
    id bigserial PRIMARY KEY,
    order_id text,
    step text,
    message text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. FUNCTIONS & TRIGGERS

-- handle_new_user (Auth Sync)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_code TEXT;
  v_org_id UUID;
BEGIN
  v_referrer_code := NEW.raw_user_meta_data->>'referrer_id';
  
  BEGIN
    IF (NEW.raw_user_meta_data->>'organization_id') IS NOT NULL THEN
      v_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;

  IF v_referrer_code IS NOT NULL AND v_referrer_code <> '' THEN
    IF v_referrer_code ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_referrer_id := v_referrer_code::UUID;
    ELSE
      SELECT id INTO v_referrer_id 
      FROM public.user_profiles 
      WHERE (email ILIKE v_referrer_code OR login ILIKE v_referrer_code)
      LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.user_profiles (
    id, email, login, whatsapp, full_name, organization_id, referrer_id, sponsor_id, role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'full_name',
    v_org_id,
    v_referrer_id,
    v_referrer_id,
    'affiliate'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp),
    login = COALESCE(EXCLUDED.login, user_profiles.login),
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    referrer_id = COALESCE(EXCLUDED.referrer_id, user_profiles.referrer_id);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- fn_process_mmn_commissions
CREATE OR REPLACE FUNCTION public.fn_process_mmn_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_current_affiliate_id UUID;
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
    v_total DECIMAL(12,2) := 0;
BEGIN
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE order_id = NEW.id AND type = 'commission') THEN
            RETURN NEW;
        END IF;

        SELECT level_commissions, commission_type, leadership_bonus_config 
        INTO v_config FROM public.site_configs WHERE organization_id = NEW.organization_id LIMIT 1;

        IF v_config IS NULL THEN
            v_level_commissions := '["10", "5", "3", "2", "1"]'::JSONB;
            v_is_fixed := FALSE;
            v_leadership_bonus_config := '[]'::JSONB;
        ELSE
            v_level_commissions := COALESCE(v_config.level_commissions, '["10", "5", "3", "2", "1"]'::JSONB);
            v_is_fixed := (COALESCE(v_config.commission_type, 'percentage') = 'fixed');
            v_leadership_bonus_config := COALESCE(v_config.leadership_bonus_config, '[]'::JSONB);
        END IF;

        v_order_amount := NEW.total_amount;
        v_current_affiliate_id := NEW.affiliate_id;

        FOR v_level IN 0..(JSONB_ARRAY_LENGTH(v_level_commissions) - 1) LOOP
            EXIT WHEN v_current_affiliate_id IS NULL;
            SELECT * INTO v_profile FROM public.user_profiles WHERE id = v_current_affiliate_id;
            IF v_profile IS NULL THEN EXIT; END IF;
            v_commission_value := (v_level_commissions->>v_level)::DECIMAL;
            IF v_is_fixed THEN v_commission_amount := v_commission_value;
            ELSE v_commission_amount := v_order_amount * (v_commission_value / 100); END IF;
            v_new_total_sales := COALESCE(v_profile.total_sales, 0) + v_order_amount;
            v_leadership_bonus := 0;
            v_new_rank := v_profile.rank;
            FOR v_rank_config IN SELECT * FROM jsonb_to_recordset(v_leadership_bonus_config) AS x(name TEXT, threshold DECIMAL, percentage DECIMAL) ORDER BY threshold DESC LOOP
                IF v_new_total_sales >= v_rank_config.threshold THEN
                    IF v_is_fixed THEN v_leadership_bonus := v_rank_config.percentage;
                    ELSE v_leadership_bonus := v_order_amount * (v_rank_config.percentage / 100); END IF;
                    v_new_rank := v_rank_config.name;
                    EXIT;
                END IF;
            END LOOP;
            UPDATE public.user_profiles SET
                balance = COALESCE(balance, 0) + v_commission_amount + v_leadership_bonus,
                total_earnings = COALESCE(total_earnings, 0) + v_commission_amount + v_leadership_bonus,
                total_sales = v_new_total_sales,
                rank = COALESCE(v_new_rank, rank)
            WHERE id = v_profile.id;
            INSERT INTO public.wallet_transactions (user_id, order_id, amount, type, description)
            VALUES (v_profile.id, NEW.id, v_commission_amount + v_leadership_bonus, 'commission', 'Comissão Nível ' || (v_level + 1) || ' - Pedido #' || SUBSTR(NEW.id::TEXT, 1, 8));
            v_total := v_total + v_commission_amount + v_leadership_bonus;
            v_current_affiliate_id := COALESCE(v_profile.referrer_id, v_profile.sponsor_id);
        END LOOP;
        UPDATE public.orders SET commission_amount = v_total WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_process_mmn_commissions
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_process_mmn_commissions();

-- 5. RLS POLICIES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = affiliate_id);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
ALTER TABLE public.site_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site configs are viewable by everyone" ON public.site_configs FOR SELECT USING (true);
