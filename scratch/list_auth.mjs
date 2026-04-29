import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const NEW_PROJECT_URL = 'https://aabqswnfxzvxvzctzqhz.supabase.co';
const NEW_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY);

async function listAllAuthUsers() {
    console.log("\n--- Listando TODOS os usuarios no Authentication ---");

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Erro ao listar usuarios:", error.message);
        return;
    }

    users.forEach(u => {
        console.log(`- ${u.email} (ID: ${u.id})`);
    });

    const target = users.find(u => u.email === 'weidertestando123@gmail.com');
    if (target) {
        console.log("\nACHEI! O usuario está no Auth com o ID: " + target.id);
    } else {
        console.log("\nConfirmado: O usuario NÃO está na lista de Authentication.");
    }
}

listAllAuthUsers();
