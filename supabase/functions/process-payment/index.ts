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
    const { items, user_info, total_amount, organization_id, affiliate_id, payment_method_id } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Configs for this organization
    const { data: configData } = await supabase
      .from('site_configs')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    // Calculate commission (Default 10% if no config found)
    let commission_amount = 0;
    if (affiliate_id && items && items.length > 0) {
      if (configData && configData.level_commissions && configData.level_commissions.length > 0) {
        const directRate = parseFloat(configData.level_commissions[0]) / 100;
        commission_amount = total_amount * directRate;
      } else {
        commission_amount = total_amount * 0.10; // Fallback to 10%
      }
    }

    // Generate a unique payment_id for reference
    const order_ref = `WA_${Date.now().toString().slice(-6)}`;

    // Save order in Supabase
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
      affiliate_id: affiliate_id,
      commission_amount: commission_amount
    }).select().single();

    if (dbError) {
      console.error('Error saving order:', dbError);
      throw new Error(`Falha no banco de dados: ${dbError.message}`);
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
