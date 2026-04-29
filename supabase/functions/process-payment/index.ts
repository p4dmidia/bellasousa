import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json();
        console.log('Incoming WhatsApp Order:', JSON.stringify(body, null, 2));

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { 
            items, 
            user_info, 
            total_amount, 
            organization_id, 
            affiliate_id, 
            referral_code 
        } = body;

        if (!items || !organization_id) {
            throw new Error("Dados insuficientes para registrar o pedido.");
        }

        console.log('Registering new order for Bela Sousa...');
        
        // 1. Resolver afiliado (quem indicou)
        let resolved_affiliate_id = null;
        const targetSource = referral_code || affiliate_id;
        
        if (targetSource) {
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
            }
        }

        // 2. Resolver Recebedor da Comissão (Referrer/Sponsor do comprador ou o próprio afiliado se for venda direta)
        let recipient_id = null;
        if (resolved_affiliate_id) {
            // Se o comprador for o próprio afiliado, a comissão sobe para o indicador dele.
            // Se for uma venda para um cliente externo, a comissão vai para o afiliado.
            // Para simplificar: usamos o resolved_affiliate_id como o beneficiário imediato.
            recipient_id = resolved_affiliate_id;
        }

        // 3. Calcular comissão inicial (Nível 1)
        let commission_amount = 0;
        if (recipient_id) {
            const { data: configData } = await supabase
                .from('site_configs')
                .select('*')
                .eq('organization_id', organization_id)
                .maybeSingle();

            let rateOrValue = 10;
            let isFixed = false;

            if (configData) {
                isFixed = configData.commission_type === 'fixed';
                if (Array.isArray(configData.level_commissions) && configData.level_commissions.length > 0) {
                    rateOrValue = parseFloat(configData.level_commissions[0]) || 0;
                }
            }
            
            commission_amount = isFixed ? rateOrValue : (total_amount || 0) * (rateOrValue / 100);
            if (isNaN(commission_amount)) commission_amount = 0;
        }

        // 4. Inserir Pedido
        const order_ref = `WA_${Date.now().toString().slice(-6)}`;
        const insertData = {
            organization_id: organization_id,
            customer_name: user_info?.name || 'Cliente',
            customer_email: (user_info?.email && user_info.email !== '-') ? user_info.email : null,
            whatsapp: (user_info?.whatsapp && user_info.whatsapp !== '-') ? user_info.whatsapp : null,
            total_amount: total_amount || 0,
            items: items,
            status: 'pending',
            payment_id: order_ref,
            payment_method: 'whatsapp',
            affiliate_id: resolved_affiliate_id,
            referrer_id: recipient_id,
            commission_amount: commission_amount
        };

        const { data: orderData, error: dbError } = await supabase.from('orders').insert(insertData).select();
        if (dbError) throw new Error(`Erro ao salvar pedido: ${dbError.message}`);
        
        return new Response(JSON.stringify({ 
            success: true, 
            order: orderData[0], 
            message: 'Pedido registrado com sucesso.' 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Function Error:", error.message);
        return new Response(JSON.stringify({ 
            error: true,
            message: error.message
        }), {
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
