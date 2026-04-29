import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const OLD_PROJECT_URL = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const OLD_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_ROLE_KEY);

async function checkOldId() {
    const id = 'e28b269f-4e15-4c58-8b9c-2e0c1dd2e0a5';
    console.log(`\n--- Buscando ID no Banco Antigo: ${id} ---`);

    const { data: profile, error } = await oldSupabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error("Erro ao buscar no banco antigo:", error.message);
        return;
    }

    if (profile) {
        console.log("ID ENCONTRADO NO BANCO ANTIGO!");
        console.log("Nome:", profile.full_name);
        console.log("E-mail:", profile.email);
        console.log("Organizacao Antiga:", profile.organization_id);
        console.log("Status:", profile.status);
    } else {
        console.log("O ID tambem nao existe no banco antigo. Pode ser um ID de teste deletado ou de outro projeto.");
    }
}

checkOldId();
