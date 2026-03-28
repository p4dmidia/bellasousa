import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { items, user_info, total_amount, organization_id, affiliate_id, referral_code, payment_method_id } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Resolve referral_code to affiliate_id if provided
    let resolved_affiliate_id = affiliate_id;
    
    if (referral_code) {
      console.log('Resolving referral_code:', referral_code);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(referral_code);
      let query = supabase.from('user_profiles').select('id');
      
      if (isUUID) {
        query = query.or(`id.eq.${referral_code},email.ilike.${referral_code},login.eq.${referral_code}`);
      } else {
        const sanitizedCpf = referral_code.replace(/\D/g, '');
        query = query.or(`email.ilike.${referral_code},login.eq.${referral_code},cpf.eq.${referral_code},cpf.eq.${sanitizedCpf}`);
      }

      const { data: affData } = await query
        .eq('organization_id', organization_id)
        .maybeSingle();

      if (affData) {
        resolved_affiliate_id = affData.id;
        console.log('Affiliate resolved to ID:', resolved_affiliate_id);
      } else {
        console.warn('Affiliate NOT found for code:', referral_code);
      }
    }

    // 2. Fetch Configs for this organization
    const { data: configData } = await supabase
      .from('site_configs')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    // 3. Calculate commission (Default 10% if no config found)
    // NOVA REGRA: O comprador (resolved_affiliate_id) não recebe comissão.
    // Buscamos o indicador dele para calcular a comissão de nível 1 do pedido.
    let commission_amount = 0;
    let recipient_id = null;

    if (resolved_affiliate_id) {
      const { data: buyerProfile } = await supabase
        .from('user_profiles')
        .select('referrer_id, sponsor_id')
        .eq('id', resolved_affiliate_id)
        .maybeSingle();

      recipient_id = buyerProfile?.referrer_id || buyerProfile?.sponsor_id;

      if (items && items.length > 0 && recipient_id) {
        if (configData && configData.level_commissions && configData.level_commissions.length > 0) {
          const rateOrValue = parseFloat(configData.level_commissions[0]);
          const isFixed = configData.commission_type === 'fixed';
          
          if (isFixed) {
            commission_amount = rateOrValue; // Fixed value per order
          } else {
            commission_amount = total_amount * (rateOrValue / 100);
          }
        } else {
          commission_amount = total_amount * 0.10; // Fallback to 10%
        }
      }
    }

    // Generate a unique payment_id for reference
    const order_ref = `WA_${Date.now().toString().slice(-6)}`;

    // 4. Save order in Supabase
    const { data: orderData, error: dbError } = await supabase.from('orders').insert({
      organization_id: organization_id,
      nome: user_info?.name || 'Cliente',
      customer_name: user_info?.name || 'Cliente', // Legacy column
      email: user_info?.email,
      whatsapp: user_info?.whatsapp,
      total_amount: total_amount,
      items: items, // Save line items
      status: 'pending', // WhatsApp orders start as pending
      payment_id: order_ref,
      payment_method: payment_method_id || 'whatsapp',
      affiliate_id: resolved_affiliate_id,
      referrer_id: recipient_id, // Identificar quem ganha a comissão no nível 1
      commission_amount: commission_amount
    }).select().single();

    if (dbError) {
      console.error('Database Error saving order:', dbError);
      throw new Error(`Erro ao salvar pedido: ${dbError.message} (${dbError.code || 'sem código'})`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: orderData,
        message: 'Pedido registrado. Prossiga para o WhatsApp.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error("API Payment Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
