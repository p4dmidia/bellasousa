import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';
const ORGANIZATION_ID = '512f9aeb-683a-49c0-9731-76a7c8d10e8d';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration(refCode) {
    console.log(`--- TESTING REGISTRATION WITH REF: ${refCode} ---`);
    
    // 1. Simulating the 'useEffect' / 'handleSubmit' resolution logic
    console.log("1. Resolving Referrer...");
    const { data: referrer, error: refError } = await supabase.from('user_profiles')
        .select('id, email, login, organization_id')
        .or(`email.ilike.${refCode},login.ilike.${refCode}`)
        .maybeSingle();
        
    if (refError) {
        console.error("Resolution Error:", refError);
        return;
    }
    
    if (!referrer) {
        console.error("Referrer not found for code:", refCode);
        return;
    }
    
    console.log("Referrer Resolved:", { id: referrer.id, login: referrer.login, org: referrer.organization_id });
    
    const testEmail = `test_${Math.random().toString(36).substring(2, 8)}@example.com`;
    const testPassword = 'Password123!';
    const referrerId = referrer.id;
    
    // 2. Simulating the 'signUp' call
    console.log(`2. Signing up test user: ${testEmail}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
            data: {
                full_name: "Test Antigravity",
                whatsapp: "11999999999",
                login: `test_${Math.random().toString(36).substring(2, 6)}`,
                organization_id: ORGANIZATION_ID, // Bella Sousa
                referrer_id: referrerId,
                sponsor_id: referrerId,
                registration_type: 'business'
            }
        }
    });
    
    if (signUpError) {
        console.error("SignUp Error:", signUpError);
        return;
    }
    
    console.log("SignUp Success! User ID:", signUpData.user.id);
    
    // 3. Waiting for trigger to run and checking user_profiles
    console.log("3. Verifying user_profiles linkage (waiting 2s)...");
    await new Promise(r => setTimeout(r, 2000));
    
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .maybeSingle();
        
    if (profileError) {
        console.error("Profile Fetch Error:", profileError);
    } else if (!profile) {
        console.error("Profile NOT CREATED in user_profiles. Trigger might have failed!");
    } else {
        console.log("Profile Verified:", {
            id: profile.id,
            email: profile.email,
            referrer_id: profile.referrer_id,
            organization_id: profile.organization_id,
            sponsor_id: profile.sponsor_id
        });
        
        const isCorrect = profile.referrer_id === referrerId && profile.organization_id === ORGANIZATION_ID;
        console.log("RESULT: " + (isCorrect ? "SUCCESS ✅" : "FAILED ❌"));
    }
}

// Test with edigleza33_sousa
testRegistration('edigleza33_sousa');
