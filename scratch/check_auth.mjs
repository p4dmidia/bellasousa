import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const NEW_PROJECT_URL = 'https://aabqswnfxzvxvzctzqhz.supabase.co';
const NEW_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY);

async function checkAuthUser() {
    const email = 'elizateste@gmail.com';
    console.log(`\n--- Inspecionando Auth.Users: ${email} ---`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Erro ao listar usuarios:", error.message);
        return;
    }

    const targetUser = users.find(u => u.email === email);

    if (targetUser) {
        console.log("Usuario encontrado no AUTH!");
        console.log("ID:", targetUser.id);
        console.log("Metadata:", JSON.stringify(targetUser.user_metadata, null, 2));
    } else {
        console.log("Usuario TAMBEM nao encontrado no AUTH. O cadastro nao foi realizado.");
    }
}

checkAuthUser();
