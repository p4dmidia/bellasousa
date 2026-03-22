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

      // Update Affiliate Balance if payment was approved and there is an affiliate
      if (newStatus === 'completed' && orderData && orderData.affiliate_id) {
        // Fetch current profile data
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('balance, total_earnings, total_sales, rank, leadership_bonus_total')
          .eq('id', orderData.affiliate_id)
          .single();
        
        // Fetch Dynamic Config
        const { data: configData } = await supabase
          .from('site_configs')
          .select('leadership_bonus_config, commission_type')
          .eq('organization_id', orderData.organization_id)
          .maybeSingle();

        const bonusConfig = configData?.leadership_bonus_config || [
          { name: 'Bronze', threshold: 500, percentage: 1 },
          { name: 'Prata', threshold: 1000, percentage: 1 },
          { name: 'Ouro', threshold: 2500, percentage: 1 },
          { name: 'Diamante', threshold: 5000, percentage: 1 }
        ];

        if (!profileError && profile) {
          const currentTotalSales = Number(profile.total_sales || 0);
          const orderAmount = Number(orderData.total_amount || 0);
          const newTotalSales = currentTotalSales + orderAmount;
          
          // Leadership Bonus Logic (Dynamic)
          // Sort config by threshold descending to find the highest rank achieved
          const sortedConfig = [...bonusConfig].sort((a, b) => b.threshold - a.threshold);
          const currentRankConfig = sortedConfig.find(c => newTotalSales >= c.threshold);

          let leadershipBonus = 0;
          let newRank = profile.rank || 'Consultor';

          if (currentRankConfig) {
            const isFixed = configData?.commission_type === 'fixed';
            leadershipBonus = isFixed 
              ? Number(currentRankConfig.percentage || 0) 
              : orderAmount * (Number(currentRankConfig.percentage || 0) / 100);
            newRank = currentRankConfig.name;
          }

          const commissionAmount = Number(orderData.commission_amount || 0);
          const totalBonusToAdd = commissionAmount + leadershipBonus;

          await supabase
            .from('user_profiles')
            .update({
              balance: (Number(profile.balance || 0)) + totalBonusToAdd,
              total_earnings: (Number(profile.total_earnings || 0)) + totalBonusToAdd,
              total_sales: newTotalSales,
              rank: newRank,
              leadership_bonus_total: (Number(profile.leadership_bonus_total || 0)) + leadershipBonus
            })
            .eq('id', orderData.affiliate_id);

          // Update order with leadership bonus if column exists
          if (leadershipBonus > 0) {
             await supabase
               .from('orders')
               .update({ leadership_bonus_amount: leadershipBonus })
               .eq('payment_id', id.toString());
          }
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response('Error Processing Webhook', { status: 500 })
  }
})
