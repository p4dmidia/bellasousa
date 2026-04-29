import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const NEW_PROJECT_URL = 'https://aabqswnfxzvxvzctzqhz.supabase.co';
const NEW_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY);

async function checkNetworkIntegrity() {
    console.log("\n--- Verificando Integridade da Rede (Novos Usuarios) ---");

    const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('email, referrer_id')
        .not('referrer_id', 'is', null)
        .limit(10);

    if (error) {
        console.error("Erro ao buscar perfis:", error.message);
        return;
    }

    if (profiles && profiles.length > 0) {
        console.log(`Sucesso: Encontrei ${profiles.length} usuarios com indicador vinculado.`);
        profiles.forEach(p => console.log(`- ${p.email} -> Indicador ID: ${p.referrer_id}`));
    } else {
        console.log("ALERTA: NENHUM usuario dos 41 migrados possui indicador vinculado!");
    }
}

checkNetworkIntegrity();
