import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'
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
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) throw new Error('MERCADO_PAGO_ACCESS_TOKEN is missing');

    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
    const payment = new Payment(client);

    const body = await req.json();
    const { payment_data, items, user_info, total_amount, organization_id, affiliate_id, payment_method_id } = body;

    // Optional: create order in Supabase before payment, as 'pending'
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call Mercado Pago API to create the payment
    const bodyPayload: any = {
        ...payment_data,
        transaction_amount: Number(total_amount),
        description: `Pedido - ${items.length} itens`,
        metadata: {
          user_email: user_info?.email,
          organization_id: organization_id,
          affiliate_id: affiliate_id,
        }
    };

    // Ensure payer exists even if not in payment_data
    if (!bodyPayload.payer) {
      bodyPayload.payer = {};
    }
    
    // Inject Email if missing
    if (!bodyPayload.payer.email && user_info?.email) {
      bodyPayload.payer.email = user_info.email;
    }

    // Inject CPF and Name for PIX
    if (!bodyPayload.payer.identification && user_info?.cpf) {
        bodyPayload.payer.identification = {
             type: 'CPF',
             number: user_info.cpf.replace(/\D/g, '')
        };
    }
    if (!bodyPayload.payer.first_name && user_info?.name) {
        bodyPayload.payer.first_name = user_info.name.split(' ')[0];
        bodyPayload.payer.last_name = user_info.name.split(' ').slice(1).join(' ');
    }

    let paymentResult: any;

    if (bodyPayload.payment_method_id && bodyPayload.payment_method_id.startsWith('manual_')) {
      // Manual POS order bypass - no gateway
      paymentResult = {
        id: 'pos_' + Date.now().toString(),
        status: 'approved',
        payment_method_id: bodyPayload.payment_method_id,
        point_of_interaction: {}
      };
    } else {
      paymentResult = await payment.create({
        body: bodyPayload
      });
    }

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

    // Save order in Supabase
    const { error: dbError } = await supabase.from('orders').insert({
      organization_id: organization_id,
      nome: user_info?.name || 'Cliente',
      customer_name: user_info?.name || 'Cliente', // Legacy column
      email: user_info?.email,
      whatsapp: user_info?.whatsapp,
      total_amount: total_amount,
      items: items, // Save line items
      status: paymentResult.status === 'approved' ? 'completed' : 'pending',
      payment_id: paymentResult.id?.toString(),
      payment_method: payment_method_id,
      affiliate_id: affiliate_id,
      commission_amount: commission_amount
    });

    if (dbError) {
      console.error('Error saving order:', dbError);
      throw new Error(`Falha no banco de dados: ${dbError.message}. Detalhes: ${dbError.details || JSON.stringify(dbError)}`);
    }

    return new Response(
      JSON.stringify(paymentResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error("API Payment Error:", error);
    
    // Extract deep error cause if present from MP SDK
    let errorMessage = error.message;
    let errorDetails = null;

    if (error.cause) {
        errorDetails = error.cause;
        if (Array.isArray(error.cause)) {
            errorMessage = error.cause.map((e: any) => e.message || e.description || JSON.stringify(e)).join(' | ');
        } else if (typeof error.cause === 'object') {
            errorMessage = error.cause.message || error.cause.description || JSON.stringify(error.cause);
        }
    }

    return new Response(
      JSON.stringify({ error: errorMessage, details: errorDetails }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
