import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const OLD_PROJECT_URL = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const OLD_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;
const NEW_PROJECT_URL = 'https://aabqswnfxzvxvzctzqhz.supabase.co';
const NEW_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_ROLE_KEY);
const newSupabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY);

const WEIDER_ID = 'e28b269f-4e15-4c58-8b9c-2e0c1dd2e0a5';
const BELA_SOUSA_ORG = '512f9aeb-683a-49c0-9731-76a7c8d10e8d';

async function migrateWeider() {
    console.log("\n=== Migrando Weider para Bela Sousa ===");

    // 1. Pegar dados do Weider no banco antigo
    const { data: weider, error: fetchError } = await oldSupabase
        .from('user_profiles')
        .select('*')
        .eq('id', WEIDER_ID)
        .single();

    if (fetchError) {
        console.error("Erro ao buscar Weider:", fetchError.message);
        return;
    }

    // 2. Inserir no novo banco com a organização correta
    const { error: insertError } = await newSupabase
        .from('user_profiles')
        .upsert({
            ...weider,
            organization_id: BELA_SOUSA_ORG,
            role: 'affiliate',
            status: 'active'
        });

    if (insertError) {
        console.error("Erro ao inserir no novo banco:", insertError.message);
        return;
    }

    // 3. Criar o login (Auth) no novo banco
    const { error: authError } = await newSupabase.auth.admin.createUser({
        id: WEIDER_ID,
        email: weider.email,
        password: 'BelaSousa2026!',
        email_confirm: true,
        user_metadata: {
            full_name: weider.full_name,
            organization_id: BELA_SOUSA_ORG
        }
    });

    if (authError && !authError.message.includes('already exists')) {
        console.error("Erro ao criar Auth:", authError.message);
    } else {
        console.log("SUCESSO: Weider migrado e vinculado a Bela Sousa!");
        console.log("O link http://localhost:3000/cadastro?ref=e28b269f-4e15-4c58-8b9c-2e0c1dd2e0a5 agora deve funcionar!");
    }
}

migrateWeider();
