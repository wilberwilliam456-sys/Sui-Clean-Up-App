// index.js - ES Module Version

// 1. Load Environment Variables (Supabase Keys)
import dotenv from 'dotenv';
dotenv.config();

// 2. Import Libraries
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// 3. Initialize External Connections
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 4. Initialize Sui Client (Connect to the main network)
const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });

/**
 * Helper function to retrieve the actual NFT Collection Name from the Sui blockchain
 */
async function fetchPackageNameFromSui(packageId) {
    try {
        const objectResponse = await suiClient.getObject({
            id: packageId,
            options: { showDisplay: true }
        });
        
        const name = objectResponse.data?.display?.data?.name;
        
        if (name) {
            return name.replace(/[{}]/g, ''); 
        }
        return `Package ID: ${packageId.substring(2, 8)}...`;
        
    } catch (error) {
        console.warn(`Sui RPC failed to fetch name for ${packageId}:`, error.message);
        return `Error fetching name`;
    }
}

// 5. Setup the Express Server
const app = express();
app.use(cors()); 
app.use(express.json());

// 6. Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Sui-Wallet-App Backend is running and secure.' });
});

// Determine status based on score
const determineStatus = (scamScore) => {
    if (scamScore < -50) {
        return { status: 'SCAM_VERIFIED', confidence: 95 };
    } else if (scamScore < -5) {
        return { status: 'DUBIOUS', confidence: 50 };
    } else if (scamScore > 50) {
        return { status: 'LEGIT_VERIFIED', confidence: 95 };
    } else {
        return { status: 'UNKNOWN', confidence: 10 };
    }
};

// 7. API Endpoints

/**
 * Check Reputation
 */
app.post('/check-reputation', async (req, res) => {
    const { packageId } = req.body;

    if (!packageId) {
        return res.status(400).json({ error: 'Missing packageId' });
    }

    try {
        const { data, error } = await supabase
            .from('packages')
            .select('scam_score, is_verified, name')
            .eq('package_id', packageId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Supabase Query Error:', error);
            return res.status(500).json({ status: 'UNKNOWN', confidence: 0, message: 'Database lookup failed.' });
        }
        
        if (data) {
            if (data.is_verified) {
                return res.json({ 
                    status: 'LEGIT_OFFICIAL', 
                    confidence: 100, 
                    packageId, 
                    name: data.name 
                });
            }

            const reputation = determineStatus(data.scam_score);
            return res.json({ 
                ...reputation, 
                packageId, 
                name: data.name
            });

        } else {
            return res.json({ status: 'UNKNOWN', confidence: 0, packageId, name: 'Unrecorded Package' });
        }
        
    } catch (e) {
        console.error('API Error:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Submit Vote
 */
app.post('/votes', async (req, res) => {
    const { packageId, userAddress, voteType } = req.body;

    if (!packageId || !userAddress || !['scam', 'legit'].includes(voteType)) {
        return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    try {
        const packageName = await fetchPackageNameFromSui(packageId);

        await supabase
            .from('packages')
            .upsert({ 
                package_id: packageId,
                name: packageName 
            }, { 
                onConflict: 'package_id',
                ignoreDuplicates: false 
            });

        const { error: voteError } = await supabase
            .from('votes')
            .insert([
                { 
                    package_id: packageId,
                    user_address: userAddress,
                    vote_type: voteType
                }
            ]);

        if (voteError) {
            if (voteError.code === '23505') {
                return res.status(409).json({ success: false, message: 'User has already voted for this package.' });
            }
            throw voteError;
        }

        res.json({ success: true, message: `Vote recorded successfully for: ${packageName}. Score updated.` });

    } catch (e) {
        console.error('Voting API Error:', e);
        res.status(500).json({ error: 'Internal Server Error during vote processing.' });
    }
});

/**
 * Verify Package (Admin)
 */
app.post('/verify', async (req, res) => {
    const { packageId, source } = req.body;

    if (!packageId || !source) {
        return res.status(400).json({ error: 'Missing packageId or source' });
    }

    try {
        const packageName = await fetchPackageNameFromSui(packageId);

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