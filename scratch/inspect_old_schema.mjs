import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const OLD_PROJECT_URL = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const OLD_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_ROLE_KEY);

async function inspectTable(tableName) {
    console.log(`\n--- ${tableName} ---`);
    const { data, error } = await oldSupabase.from(tableName).select('*').limit(1);
    if (error) {
        console.error(`Erro ao ler ${tableName}:`, error.message);
        return;
    }
    if (data && data.length > 0) {
        console.log("Colunas encontradas:", Object.keys(data[0]).join(', '));
    } else {
        console.log("Tabela vazia.");
    }
}

async function startInspection() {
    await inspectTable('user_profiles');
    await inspectTable('site_configs');
    await inspectTable('products');
    await inspectTable('orders');
    await inspectTable('wallet_transactions');
}

startInspection();
