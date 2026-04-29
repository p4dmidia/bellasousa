import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const NEW_PROJECT_URL = 'https://aabqswnfxzvxvzctzqhz.supabase.co';
const NEW_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY);

async function testManualRegistration() {
    console.log("--- Testando Cadastro Manual de elizateste@gmail.com ---");

    const email = 'elizateste@gmail.com';
    const password = 'Teste123!@#';
    
    // Tentar criar via Admin Auth (isso dispara o trigger handle_new_user)
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Eliza Teste',
            organization_id: '512f9aeb-683a-49c0-9731-76a7c8d10e8d',
            referrer_id: 'paulagoncalves@gmail.com', // Testando com o e-mail da Paula
            login: 'elizateste'
        }
    });

    if (error) {
        console.error("ERRO NO CADASTRO:", error.message);
        if (error.message.includes('trigger')) {
            console.error("CONFIRMADO: O problema eh no Trigger do banco de dados!");
        }
    } else {
        console.log("SUCESSO: Usuario criado no Auth!");
        console.log("Verificando se o Perfil foi criado...");
        
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        if (profile) {
            console.log("SUCESSO: Perfil criado e vinculado ao indicador:", profile.referrer_id);
        } else {
            console.log("ERRO: Usuario criado no Auth, mas o Perfil NAO apareceu!");
        }
    }
}

testManualRegistration();
