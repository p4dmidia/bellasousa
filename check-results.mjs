import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: orderData } = await supabase
    .from('orders')
    .select('id, affiliate_id, referrer_id, status')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!orderData || orderData.length === 0) {
    console.log("No orders found");
    return;
  }

  const order = orderData[0];
  console.log("ORDER_ID:", order.id);
  console.log("ORDER_AFFILIATE_ID:", order.affiliate_id);
  console.log("ORDER_REFERRER_ID:", order.referrer_id);
  console.log("ORDER_STATUS:", order.status);

  const { data: txs } = await supabase
    .from('wallet_transactions')
    .select('user_id, description, amount')
    .eq('order_id', order.id);

  console.log("TRANSACTIONS:", JSON.stringify(txs, null, 2));

  // Check Buyer Info
  const { data: buyer } = await supabase.from('user_profiles').select('id, login, referrer_id').eq('id', order.affiliate_id).maybeSingle();
  console.log("BUYER_PROFILE:", JSON.stringify(buyer, null, 2));
}
main();
