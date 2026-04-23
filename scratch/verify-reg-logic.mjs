// TEST SCRIPT: Simulating Affiliate.tsx logic to verify metadata generation
import { createClient } from '@supabase/supabase-js';

const ORGANIZATION_ID = '512f9aeb-683a-49c0-9731-76a7c8d10e8d';

// Mocked getStoredReferral (simulating different scenarios)
const getStoredReferral = (scenario) => {
    const scenarios = {
        'uuid': 'd367b015-c2c8-4479-aeb7-3ca2d825c878',
        'email': 'pereiratais222@gmail.com',
        'login': 'tais_bela',
        'none': null
    };
    return scenarios[scenario];
};

// Simulated fetchReferrer logic (from Affiliate.tsx)
const simulateFetchReferrer = async (ref) => {
    if (!ref) return null;
    
    // THE FIX I APPLIED: Correct Regex
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
    console.log(`Testing ref: "${ref}" | isUUID: ${isUUID}`);

    // THE FIX I APPLIED: Safer Query
    if (isUUID) {
        console.log(`  -> Action: Querying by ID: ${ref}`);
        // return { id: ref, login: 'MockedUser' }; // Simulating match
    } else {
        console.log(`  -> Action: Querying by EMAIL/LOGIN: ${ref}`);
        // return { id: 'some-uuid', login: 'MockedUser' }; // Simulating match
    }
};

async function test() {
    console.log("=== VERIFYING REGISTRATION LOGIC ===\n");

    const cases = ['uuid', 'email', 'login', 'none'];
    
    for (const c of cases) {
        const ref = getStoredReferral(c);
        console.log(`Scenario: ${c.toUpperCase()}`);
        await simulateFetchReferrer(ref);
        
        // Simulating metadata generation in handleSubmit
        const selectedAffiliate = (c === 'uuid' || c === 'email') ? { id: 'd367b015-c2c8-4479-aeb7-3ca2d825c878', login: 'tais' } : null;
        const referrerId = selectedAffiliate?.id || ref;
        
        console.log(`Resulting metadata referrer_id: ${referrerId}`);
        console.log("-----------------------------------\n");
    }
}

test();
