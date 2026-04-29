import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const OLD_PROJECT_URL = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const OLD_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;

const NEW_PROJECT_URL = 'https://aabqswnfxzvxvzctzqhz.supabase.co';
const NEW_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_ROLE_KEY);
const newSupabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY);

const DEFAULT_PASSWORD = 'BelaSousa2026!';

async function migrateAuthUsers() {
    console.log("=== INICIANDO MIGRAÇÃO DE USUÁRIOS (AUTH) ===");

    // 1. Pegar os perfis que já migramos para saber quem criar
    const { data: profiles, error: profileError } = await newSupabase
        .from('user_profiles')
        .select('id, email, full_name');

    if (profileError) {
        console.error("Erro ao ler perfis do novo banco:", profileError.message);
        return;
    }

    console.log(`Encontrados ${profiles.length} perfis para provisionar.`);

    for (const profile of profiles) {
        if (!profile.email) {
            console.warn(`Aviso: Perfil ${profile.id} não tem e-mail. Pulando.`);
            continue;
        }

        console.log(`Provisionando: ${profile.email}...`);

        // Tentar criar o usuário no novo projeto com o MESMO ID
        const { data: newUser, error: createError } = await newSupabase.auth.admin.createUser({
            id: profile.id, // Manter o mesmo ID é CRUCIAL
            email: profile.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { 
                full_name: profile.full_name,
                organization_id: '512f9aeb-683a-49c0-9731-76a7c8d10e8d'
            }
        });

        if (createError) {
            if (createError.message.includes('already exists')) {
                console.log(`- Usuário ${profile.email} já existe no Authentication.`);
            } else {
                console.error(`- Erro ao criar ${profile.email}:`, createError.message);
            }
        } else {
            console.log(`- Sucesso: ${profile.email} criado.`);
        }
    }

    console.log("\n=== MIGRAÇÃO DE AUTH CONCLUÍDA ===");
    console.log(`SENHA PADRÃO PARA TODOS: ${DEFAULT_PASSWORD}`);
}

migrateAuthUsers();
