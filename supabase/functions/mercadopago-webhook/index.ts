import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (action === 'payment' && id) {
      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      const client = new MercadoPagoConfig({ accessToken });
      const paymentClient = new Payment(client);
      
      const paymentInfo = await paymentClient.get({ id });
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      let newStatus = 'pending';
      if (paymentInfo.status === 'approved') newStatus = 'completed';
      if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') newStatus = 'cancelled';

      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('payment_id', id.toString())
        .select('affiliate_id, commission_amount, total_amount, organization_id')
        .single();

      if (fetchError) throw fetchError;

      // Note: Multi-level commissions are now handled automatically by the database trigger
      // 'tr_process_mmn_commissions' on the 'orders' table when status is 'completed'.
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response('Error Processing Webhook', { status: 500 })
  }
})
