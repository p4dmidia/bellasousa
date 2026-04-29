import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const NEW_PROJECT_URL = 'https://aabqswnfxzvxvzctzqhz.supabase.co';
const NEW_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY);

async function checkUserRegistration() {
    const email = 'elizateste@gmail.com';
    console.log(`\n--- Inspecionando Usuario: ${email} ---`);

    const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error("Erro ao buscar usuario:", error.message);
        return;
    }

    if (!user) {
        console.error("Usuario nao encontrado no banco de dados!");
        return;
    }

    console.log("ID do Usuario:", user.id);
    console.log("Organizacao:", user.organization_id);
    console.log("Indicador (referrer_id):", user.referrer_id);

    if (user.referrer_id) {
        const { data: referrer } = await supabase
            .from('user_profiles')
            .select('email, full_name, organization_id')
            .eq('id', user.referrer_id)
            .maybeSingle();
        
        if (referrer) {
            console.log("Dados do Indicador Encontrado:", referrer.email, `(${referrer.organization_id})`);
        } else {
            console.log("ALERTA: O referrer_id aponta para um ID que NÃO existe no banco!");
        }
    } else {
        console.log("AVISO: O usuario foi criado SEM indicador (referrer_id esta nulo).");
    }

    // Verificar se há logs de auditoria
    const { data: audit } = await supabase
        .from('mmn_audit')
        .select('*')
        .ilike('message', `%${email}%`)
        .limit(5);
    
    console.log("\n--- Logs de Auditoria Relacionados ---");
    console.log(audit || "Nenhum log encontrado.");
}

checkUserRegistration();
