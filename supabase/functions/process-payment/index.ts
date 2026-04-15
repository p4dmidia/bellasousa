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
    console.log('Incoming Payment Request:', JSON.stringify(body, null, 2));

    const { items, user_info, total_amount, organization_id, affiliate_id, referral_code, payment_method_id } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Resolve referral_code OR affiliate_id to a valid affiliate_id
    let resolved_affiliate_id = null;
    const targetSource = referral_code || affiliate_id;
    
    if (targetSource) {
      console.log('Resolving affiliate from:', targetSource);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSource);
      let query = supabase.from('user_profiles').select('id');
      
      if (isUUID) {
        query = query.or(`id.eq.${targetSource},email.ilike.${targetSource},login.eq.${targetSource}`);
      } else {
        const sanitizedCpf = (typeof targetSource === 'string') ? targetSource.replace(/\D/g, '') : '';
        query = query.or(`email.ilike.${targetSource},login.eq.${targetSource},cpf.eq.${targetSource},cpf.eq.${sanitizedCpf}`);
      }

      const { data: affData } = await query
        .eq('organization_id', organization_id)
        .maybeSingle();

      if (affData) {
        resolved_affiliate_id = affData.id;
        console.log('Affiliate resolved to valid ID:', resolved_affiliate_id);
      } else {
        console.warn('Affiliate NOT found or invalid for this org:', targetSource);
      }
    }

    // 2. Fetch Configs for this organization
    const { data: configData } = await supabase
      .from('site_configs')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    // 3. Calculate commission
    let commission_amount = 0;
    let recipient_id = null;

    if (resolved_affiliate_id) {
      console.log('Checking buyer profile for:', resolved_affiliate_id);
      const { data: buyerProfile, error: buyerErr } = await supabase
        .from('user_profiles')
        .select('referrer_id, sponsor_id')
        .eq('id', resolved_affiliate_id)
        .maybeSingle();

      if (buyerErr) console.error('Error fetching buyer profile:', buyerErr);
      
      recipient_id = buyerProfile?.referrer_id || buyerProfile?.sponsor_id;

      if (items && items.length > 0 && recipient_id) {
        let rateOrValue = 10; // Default 10%
        let isFixed = false;

        if (configData) {
          isFixed = configData.commission_type === 'fixed';
          if (Array.isArray(configData.level_commissions) && configData.level_commissions.length > 0) {
            rateOrValue = parseFloat(configData.level_commissions[0]) || 0;
          }
        }
        
        if (isFixed) {
          commission_amount = rateOrValue; // Fixed value per order
        } else {
          commission_amount = (total_amount || 0) * (rateOrValue / 100);
        }
        
        // Ensure valid number
        if (isNaN(commission_amount)) commission_amount = 0;
      }
    }

    // Generate a unique payment_id for reference
    const order_ref = `WA_${Date.now().toString().slice(-6)}`;

    // 4. Save order in Supabase
    console.log('Inserting order for org:', organization_id, 'with affiliate:', resolved_affiliate_id);
    
    const insertData = {
      organization_id: organization_id,
      nome: user_info?.name || 'Cliente',
      customer_name: user_info?.name || 'Cliente',
      email: (user_info?.email && user_info.email !== '-') ? user_info.email : null,
      whatsapp: (user_info?.whatsapp && user_info.whatsapp !== '-') ? user_info.whatsapp : null,
      total_amount: total_amount || 0,
      items: items,
      status: 'pending',
      payment_id: order_ref,
      payment_method: payment_method_id || 'whatsapp',
      affiliate_id: resolved_affiliate_id,
      referrer_id: recipient_id,
      commission_amount: commission_amount
    };

    const { data: orderData, error: dbError } = await supabase.from('orders').insert(insertData).select();

    if (dbError) {
      console.error('Database Error saving order:', JSON.stringify(dbError, null, 2));
      throw new Error(`Erro ao salvar pedido no banco: ${dbError.message} (${dbError.code || 'PGRST'})`);
    }

    if (!orderData || orderData.length === 0) {
      throw new Error("Erro: O pedido foi enviado, mas não foi possível confirmar o registro (RLS).");
    }

    const finalOrder = orderData[0];

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: finalOrder,
        message: 'Pedido registrado. Prossiga para o WhatsApp.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error("API Payment Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
