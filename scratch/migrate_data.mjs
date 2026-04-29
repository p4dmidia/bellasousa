import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const OLD_PROJECT_URL = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const OLD_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || ''; // USER MUST PROVIDE THIS

const NEW_PROJECT_URL = 'https://aabqswnfxzvxvzctzqhz.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYnFzd25meHp2eHZ6Y3R6cWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM4MjAyMSwiZXhwIjoyMDkyOTU4MDIxfQ.Il1Cl2P2AIweXpKWHk0ZuHgXXTgyQJPSmmpvEun9P1g';

const TARGET_ORG_ID = '512f9aeb-683a-49c0-9731-76a7c8d10e8d';

if (!OLD_SERVICE_ROLE_KEY) {
    console.error("ERRO: Você precisa definir OLD_SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env para ler os dados do banco antigo.");
    process.exit(1);
}

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_ROLE_KEY);
const newSupabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY);

async function migrateTable(tableName, query = null) {
    console.log(`Migrando tabela: ${tableName}...`);
    
    let baseQuery = oldSupabase.from(tableName).select('*');
    if (query) baseQuery = query;
    else baseQuery = baseQuery.eq('organization_id', TARGET_ORG_ID);

    const { data, error } = await baseQuery;

    if (error) {
        console.error(`Erro ao ler ${tableName}:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        let cleanedData = data;
        const validIds = new Set((await newSupabase.from('user_profiles').select('id')).data?.map(u => u.id) || []);

        // Limpeza específica para user_profiles (MMN)
        if (tableName === 'user_profiles') {
            console.log("Limpando referências cruzadas em user_profiles...");
            cleanedData = data.map(u => ({
                ...u,
                referrer_id: validIds.has(u.referrer_id) ? u.referrer_id : null,
                sponsor_id: validIds.has(u.sponsor_id) ? u.sponsor_id : null
            }));
        }

        // Limpeza específica para orders
        if (tableName === 'orders') {
            console.log("Limpando referências em orders...");
            cleanedData = data.map(o => ({
                ...o,
                affiliate_id: validIds.has(o.affiliate_id) ? o.affiliate_id : null,
                referrer_id: validIds.has(o.referrer_id) ? o.referrer_id : null
            }));
        }

        // Limpeza específica para wallet_transactions
        if (tableName === 'wallet_transactions') {
            console.log("Limpando referências em wallet_transactions...");
            const validOrderIds = new Set((await newSupabase.from('orders').select('id')).data?.map(o => o.id) || []);
            cleanedData = data.map(t => ({
                ...t,
                order_id: validOrderIds.has(t.order_id) ? t.order_id : null
            }));
        }

        console.log(`Inserindo ${cleanedData.length} registros em ${tableName}...`);
        
        const { error: insertError } = await newSupabase.from(tableName).upsert(cleanedData);
        if (insertError) {
            console.error(`Erro ao inserir em ${tableName}:`, insertError.message);
        } else {
            console.log(`Sucesso: ${tableName} migrada.`);
        }
    } else {
        console.log(`Aviso: Nenhum dado encontrado para ${tableName}.`);
    }
}

async function startMigration() {
    console.log("\n=== INICIANDO MIGRAÇÃO COMPLETA (BELA SOUSA) ===");
    
    // 1. Configurações
    await migrateTable('site_configs');
    
    // 2. Afiliados
    await migrateTable('user_profiles');
    
    // 3. Produtos
    await migrateTable('products');
    
    // 4. Vendas (Orders)
    await migrateTable('orders');
    
    // 5. Financeiro (Transactions)
    // Buscamos transações vinculadas aos usuários que migramos
    const { data: profiles } = await newSupabase.from('user_profiles').select('id');
    const userIds = profiles?.map(p => p.id) || [];
    
    if (userIds.length > 0) {
        console.log(`Migrando transações financeiras para ${userIds.length} usuários...`);
        await migrateTable('wallet_transactions', oldSupabase.from('wallet_transactions').select('*').in('user_id', userIds));
    }

    // 6. Auditoria (Opcional)
    console.log("Migrando logs de auditoria...");
    await migrateTable('mmn_audit', oldSupabase.from('mmn_audit').select('*').limit(500));
    
    console.log("\n=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===");
}

startMigration();
