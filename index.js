// index.js

// 1. Load Environment Variables (Supabase Keys)
require('dotenv').config();

// 2. Import Libraries
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');


// 3. Initialize External Connections
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 4. Initialize Sui Client (Connect to the main network)
// This client lets us fetch real NFT data from the Sui blockchain.
const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });


/**
 * Helper function to retrieve the actual NFT Collection Name from the Sui blockchain
 * @param {string} packageId - The package (contract) ID of the NFT collection
 * @returns {string} The display name of the object, or a fallback string.
 */
  

async function fetchPackageNameFromSui(packageId) {
    try {
        const objectResponse = await suiClient.getObject({
            id: packageId,
            options: { showDisplay: true } // Request the human-readable Display metadata
        });
        
        // Use the Sui Object Display standard field for the name
        const name = objectResponse.data?.display?.data?.name;
        
        if (name) {
            // Clean up the name if it contains placeholders
            return name.replace(/[{}]/g, ''); 
        }
        // Fallback: Use a simple identifier if display is not set
        return `Package ID: ${packageId.substring(2, 8)}...`;
        
    } catch (error) {
        console.warn(`Sui RPC failed to fetch name for ${packageId}:`, error.message);
        return `Error fetching name`;
    }
}

// 5. Setup the Express Server
const app = express();
app.use(cors()); 
app.use(express.json()); // Allows server to read JSON bodies in POST requests

// 6. Test Route (Verify Server is Running)
app.get('/', (req, res) => {
    res.json({ message: 'Sui-Wallet-App Backend is running and secure.' });
});

// A simple function to determine status based on the aggregated score
const determineStatus = (scamScore) => {
    // Custom thresholds based on the crowdsourcing goal
    if (scamScore < -50) {
        return { status: 'SCAM_VERIFIED', confidence: 95 }; // 50+ community downvotes
    } else if (scamScore < -5) {
        return { status: 'DUBIOUS', confidence: 50 };     // A few downvotes
    } else if (scamScore > 50) {
        return { status: 'LEGIT_VERIFIED', confidence: 95 };
    } else {
        return { status: 'UNKNOWN', confidence: 10 };     // Default status
    }
};



// 7. --- API ENDPOINTS WILL GO HERE (e.g., /check-reputation, /vote) ---
/**
 * API Endpoint: /check-reputation
 * Fetches the reputation score from the DB and returns an actionable status.
 * Input (from FE): { packageId: '0x...' }
 * Output (to FE): { status: 'SCAM_VERIFIED', confidence: 95, name: 'SuiPunk Collection' }
 */
app.post('/check-reputation', async (req, res) => {
    const { packageId } = req.body;

    if (!packageId) {
        return res.status(400).json({ error: 'Missing packageId' });
    }

    try {
        // 1. Query the Supabase "Brain" for the aggregated data
        const { data, error } = await supabase
            .from('packages')
            .select('scam_score, is_verified, name') // Get the score, verification status, AND the name
            .eq('package_id', packageId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found'
            console.error('Supabase Query Error:', error);
            return res.status(500).json({ status: 'UNKNOWN', confidence: 0, message: 'Database lookup failed.' });
        }
        
        // 2. Run the Decision Logic
        if (data) {
            // Priority check: If it's officially verified, always return LEGIT
            if (data.is_verified) {
                return res.json({ 
                    status: 'LEGIT_OFFICIAL', 
                    confidence: 100, 
                    packageId, 
                    name: data.name 
                });
            }

            // Apply the community scoring logic
            const reputation = determineStatus(data.scam_score);
            return res.json({ 
                ...reputation, 
                packageId, 
                name: data.name // Return the name we fetched earlier
            });

        } else {
            // 3. Package not in DB yet (Brand New)
            return res.json({ status: 'UNKNOWN', confidence: 0, packageId, name: 'Unrecorded Package' });
        }
        
    } catch (e) {
        console.error('API Error:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * API Endpoint: /votes
 * Records a user's vote (legit or scam) on a specific package, and saves the name.
 * Input (from FE): { packageId: '0x...', userAddress: '0x...', voteType: 'scam' | 'legit' }
 * Output (to FE): Success message or error if already voted.
 */
app.post('/votes', async (req, res) => {
    // FIX: Use camelCase for JS variables, mapping them from req.body
    const { packageId, userAddress, voteType } = req.body; 

    // 1. Input Validation
    if (!packageId || !userAddress || !['scam', 'legit'].includes(voteType)) {
        return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    try {
        // 2. Fetch the Name from Sui before saving to the DB
        const packageName = await fetchPackageNameFromSui(packageId); // Uses correct packageId variable

        // 3. Ensure the package record exists (or create it) with the CORRECT name
        await supabase
            .from('packages')
            .upsert({ 
                package_id: packageId, // Maps JS packageId to DB package_id
                name: packageName 
            }, { 
                onConflict: 'package_id', // Uses the unique DB column name
                ignoreDuplicates: false 
            });

        // 4. Insert the new vote into the 'votes' table
        const { error: voteError } = await supabase
            .from('votes')
            .insert([
                { 
                    package_id: packageId,     // Maps JS variable to DB column
                    user_address: userAddress, // Maps JS variable to DB column
                    vote_type: voteType        // Maps JS variable to DB column
                }
            ]);

        // 5. Handle Errors (e.g., User already voted)
        if (voteError) {
            // Error code 23505 is PostgreSQL's unique constraint violation (user already voted)
            if (voteError.code === '23505') {
                return res.status(409).json({ success: false, message: 'User has already voted for this package.' });
            }
            throw voteError;
        }

        // 6. Success
        res.json({ success: true, message: `Vote recorded successfully for: ${packageName}. Score updated.` });

    } catch (e) {
        console.error('Voting API Error:', e);
        res.status(500).json({ error: 'Internal Server Error during vote processing.' });
    }
});


/**
 * API Endpoint: /verify
 * Allows an admin/trusted source to officially mark a package as verified.
 * This also updates the 'is_verified' flag in the packages table.
 * Input (from Admin): { packageId: '0x...', source: 'OfficialDevTeam' }
 * Output: Success message.
 */
app.post('/verify', async (req, res) => {
    const { packageId, source } = req.body;

    if (!packageId || !source) {
        return res.status(400).json({ error: 'Missing packageId or source' });
    }

    try {
        // 1. Fetch the Name from Sui (or use fallback)
        const packageName = await fetchPackageNameFromSui(packageId);

        // 2. Add the package to the 'trusted_list'
        const { error: trustedError } = await supabase
            .from('trusted_list')
            .upsert({ 
                package_id: packageId, 
                name: packageName, 
                source: source 
            }, { 
                onConflict: 'package_id' 
            });
        
        if (trustedError) throw trustedError;


        // 3. Update the 'packages' table to set the official flag
        // Use upsert to create the record if it doesn't exist yet, or update it if it does.
        await supabase
            .from('packages')
            .upsert({ 
                package_id: packageId, 
                is_verified: true, 
                name: packageName 
            }, { 
                onConflict: 'package_id', 
                ignoreDuplicates: false 
            });

        // 4. Success
        res.json({ success: true, message: `Package ${packageName} officially marked as verified by ${source}.` });

    } catch (e) {
        console.error('Verification API Error:', e);
        res.status(500).json({ error: 'Internal Server Error during verification.' });
    }
});


// 8. Start the Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`\n Backend running on http://localhost:${PORT}`);
    console.log(`   Database connection ready.`);
});
