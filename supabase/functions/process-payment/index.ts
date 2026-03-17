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
    const { payment_data, items, user_info, total_amount, organization_id, affiliate_id } = body;

    // Optional: create order in Supabase before payment, as 'pending'
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call Mercado Pago API to create the payment
    const paymentResult = await payment.create({
      body: {
        ...payment_data,
        description: `Pedido - ${items.length} itens`,
        metadata: {
          user_email: user_info?.email,
          organization_id: organization_id,
          affiliate_id: affiliate_id,
        }
      }
    });

    // Calculate commission (10% for direct referral)
    const commission_amount = affiliate_id ? (total_amount * 0.10) : 0;

    // Save order in Supabase
    const { error: dbError } = await supabase.from('orders').insert({
      organization_id: organization_id,
      email: user_info?.email,
      total_amount: total_amount,
      status: paymentResult.status === 'approved' ? 'completed' : 'pending',
      payment_id: paymentResult.id?.toString(),
      affiliate_id: affiliate_id,
      commission_amount: commission_amount
    });

    if (dbError) {
      console.error('Error saving order:', dbError);
    }

    return new Response(
      JSON.stringify(paymentResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
