# 🔐 Sui Wallet Security Backend - Community Intelligence Layer

A robust **Express.js** backend serving as the Community Intelligence Layer for a Sui wallet security application. This server aggregates crowdsourced security votes and enriches them with official Sui blockchain data to provide real-time trust scoring for NFT collections and smart contracts.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Naming Conventions](#naming-conventions)
- [Local Setup](#local-setup)
- [API Documentation](#api-documentation)
  - [Check Reputation](#1-check-reputation)
  - [Submit Vote](#2-submit-vote)
  - [Verify Package](#3-verify-package-admin-only)
- [Database Schema](#database-schema)
- [How It Works](#how-it-works)
- [Team Collaboration Guide](#team-collaboration-guide)

---

## 🎯 Project Overview

The **Community Intelligence Layer** is designed to solve a critical problem in the Sui ecosystem: **How do users trust new NFT collections and smart contracts?**

This backend:
- **Crowdsources security votes** from the community
- **Calculates real-time reputation scores** using PostgreSQL triggers
- **Enriches data** with official Sui blockchain metadata
- **Manages a trusted list** for officially verified projects

### Key Use Cases:
1. **User Protection**: A wallet user can query if a package is suspicious before interacting with it
2. **Community Participation**: Users vote "legit" or "scam" to help others
3. **Official Verification**: Developers can register their official packages to bypass community scoring
4. **Real-Time Updates**: Reputation scores update automatically as votes come in

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Crowdsourcing** | Community members vote on package legitimacy (`scam` or `legit`) |
| **Real-Time Scoring** | PostgreSQL triggers automatically aggregate votes into a `scam_score` |
| **Sui Data Enrichment** | Fetches official display names from the Sui blockchain for every package |
| **Official Trust Management** | Admins can mark packages as officially verified, bypassing community scoring |
| **Duplicate Vote Prevention** | Database constraints prevent the same user from voting twice on a package |
| **CORS Enabled** | Frontend applications across different domains can safely query the API |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Express.js** | REST API framework |
| **Supabase** | PostgreSQL database + authentication |
| **Sui SDK** (@mysten/sui) | Blockchain data retrieval |
| **CORS** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |

---

## 📌 Naming Conventions

**This is critical for frontend developers to understand!**

### JavaScript/API Layer (camelCase)
When sending requests to the API or working in JavaScript, use **camelCase**:
- `packageId` - The contract/package identifier
- `userAddress` - The wallet address of the voter
- `voteType` - The vote category (`scam` or `legit`)

**Example API Input:**
```json
{
  "packageId": "0x1a2b3c4d5e6f7g8h9i0j",
  "userAddress": "0x9j8i7h6g5f4e3d2c1b0a",
  "voteType": "scam"
}
```

### Database Layer (snake_case)
Inside Supabase PostgreSQL, all columns use **snake_case**:
- `package_id` - Maps from API `packageId`
- `user_address` - Maps from API `userAddress`
- `vote_type` - Maps from API `voteType`
- `scam_score` - Aggregated score (-∞ to +∞)
- `is_verified` - Boolean flag for official verification

**Why the difference?**
- JavaScript follows camelCase conventions
- SQL databases follow snake_case conventions
- The backend automatically maps between them

---

## 🚀 Local Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- A **Supabase account** with a project created
- The **Supabase URL** and **API Key** (anon role)

### Step 1: Clone and Install Dependencies

```bash
cd Sui-Wallet-App-Backend
npm install
```

This installs:
- `express` - Web framework
- `@supabase/supabase-js` - Database client
- `@mysten/sui` - Blockchain SDK
- `cors` - Cross-origin support
- `dotenv` - Environment variables

### Step 2: Create `.env` File

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here

# Optional: Customize Port (default is 8080)
PORT=8080
```

**Where to find these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings → API**
4. Copy the **Project URL** and **anon public** key

### Step 3: Start the Server

```bash
node index.js
```

**Expected output:**
```
Backend running on http://localhost:8080
   Database connection ready.
```

### Step 4: Verify the Server

Test the health check endpoint:

```bash
curl http://localhost:8080
```

**Response:**
```json
{
  "message": "Sui-Wallet-App Backend is running and secure."
}
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8080
```

---

### 1. Check Reputation

**Purpose**: Query the reputation status of an NFT package or smart contract.

**Method**: `POST`

**Route**: `/check-reputation`

**Input (Request Body):**
```json
{
  "packageId": "0x1a2b3c4d5e6f7g8h9i0j"
}
```

**Output (Success Response):**
```json
{
  "status": "SCAM_VERIFIED",
  "confidence": 95,
  "packageId": "0x1a2b3c4d5e6f7g8h9i0j",
  "name": "SuiPunk Collection"
}
```

**Status Values:**

| Status | Meaning | Scam Score | Confidence | Color (UI) |
|--------|---------|-----------|------------|-----------|
| `SCAM_VERIFIED` | Community consensus: This is a scam | < -50 | 95% | 🔴 Red |
| `DUBIOUS` | Some community reports of scamming | -5 to -50 | 50% | 🟡 Yellow |
| `LEGIT_VERIFIED` | Community consensus: This is legitimate | > 50 | 95% | 🟢 Green |
| `LEGIT_OFFICIAL` | Officially verified by a trusted source | N/A | 100% | 🟢 Dark Green |
| `UNKNOWN` | No community data available | -5 to 50 | 10% | ⚪ Gray |

**Error Response:**
```json
{
  "status": "UNKNOWN",
  "confidence": 0,
  "message": "Database lookup failed."
}
```

**Frontend Usage Example:**
```javascript
const checkReputation = async (packageId) => {
  const response = await fetch('http://localhost:8080/check-reputation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId })
  });
  const data = await response.json();
  
  // Display warning if SCAM_VERIFIED or DUBIOUS
  if (data.status === 'SCAM_VERIFIED') {
    alert(`⚠️ WARNING: ${data.name} is flagged as a scam!`);
  }
};
```

---

### 2. Submit Vote

**Purpose**: Record a user's vote on whether a package is legitimate or a scam.

**Method**: `POST`

**Route**: `/votes`

**Input (Request Body):**
```json
{
  "packageId": "0x1a2b3c4d5e6f7g8h9i0j",
  "userAddress": "0x9j8i7h6g5f4e3d2c1b0a",
  "voteType": "scam"
}
```

**Parameters:**
- `packageId` (string, required): The Sui package/contract identifier
- `userAddress` (string, required): The wallet address of the voter
- `voteType` (string, required): Either `"scam"` or `"legit"`

**Output (Success Response):**
```json
{
  "success": true,
  "message": "Vote recorded successfully for: SuiPunk Collection. Score updated."
}
```

**Output (Duplicate Vote Error):**
```json
{
  "success": false,
  "message": "User has already voted for this package."
}
```

**HTTP Status Codes:**
- `200` - Vote recorded successfully
- `400` - Missing or invalid fields
- `409` - User has already voted for this package
- `500` - Server error

**Frontend Usage Example:**
```javascript
const submitVote = async (packageId, userAddress, voteType) => {
  try {
    const response = await fetch('http://localhost:8080/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId, userAddress, voteType })
    });
    
    if (response.status === 409) {
      alert("You've already voted on this package!");
      return;
    }
    
    const data = await response.json();
    if (data.success) {
      alert("✅ Vote recorded! Thank you for helping secure the Sui ecosystem.");
    }
  } catch (error) {
    console.error('Vote submission failed:', error);
  }
};
```

---

### 3. Verify Package (Admin Only)

**Purpose**: Officially mark a package as verified by a trusted source (e.g., the official development team).

**Method**: `POST`

**Route**: `/verify`

**Input (Request Body):**
```json
{
  "packageId": "0x1a2b3c4d5e6f7g8h9i0j",
  "source": "OfficialDevTeam"
}
```

**Parameters:**
- `packageId` (string, required): The Sui package/contract identifier
- `source` (string, required): Name of the trusted source verifying the package (e.g., `"OfficialDevTeam"`, `"AuditedBySecurity"`)

**Output (Success Response):**
```json
{
  "success": true,
  "message": "Package SuiPunk Collection officially marked as verified by OfficialDevTeam."
}
```

**Output (Error Response):**
```json
{
  "error": "Missing packageId or source"
}
```

**⚠️ Security Note:**
This endpoint should be **protected by authentication middleware** in production. Currently, it's open to demonstrate functionality. Before deploying:

1. Add JWT authentication
2. Check for an admin role in the token
3. Only allow verified admin wallets

**Example Middleware (to add before deployment):**
```javascript
const verifyAdmin = (req, res, next) => {
  const adminWallets = ['0xadmin1...', '0xadmin2...'];
  const userAddress = req.headers['x-user-address'];
  
  if (!adminWallets.includes(userAddress)) {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }
  next();
};

app.post('/verify', verifyAdmin, async (req, res) => { ... });
```

---

## 📊 Database Schema

### Tables Overview

#### `packages`
Stores metadata and aggregated scores for each package.

```sql
CREATE TABLE packages (
  package_id TEXT PRIMARY KEY,           -- e.g., '0x1a2b3c4d...'
  name TEXT,                             -- Fetched from Sui Display
  scam_score BIGINT DEFAULT 0,           -- Aggregated vote score
  is_verified BOOLEAN DEFAULT FALSE,     -- Official verification flag
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `votes`
Stores individual community votes.

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT REFERENCES packages(package_id),
  user_address TEXT,                    -- Voter's wallet
  vote_type TEXT CHECK (vote_type IN ('scam', 'legit')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(package_id, user_address)      -- Prevent duplicate votes
);
```

#### `trusted_list`
Stores officially verified packages.

```sql
CREATE TABLE trusted_list (
  package_id TEXT PRIMARY KEY,
  name TEXT,
  source TEXT,                          -- e.g., 'OfficialDevTeam'
  verified_at TIMESTAMP DEFAULT NOW()
);
```

### PostgreSQL Trigger (Real-Time Scoring)

A trigger automatically updates the `scam_score` whenever votes are added:

```sql
CREATE OR REPLACE FUNCTION update_scam_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE packages
  SET scam_score = (
    SELECT 
      COALESCE(SUM(CASE WHEN vote_type = 'legit' THEN 1 ELSE -1 END), 0)
    FROM votes
    WHERE package_id = NEW.package_id
  ),
  updated_at = NOW()
  WHERE package_id = NEW.package_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_score_after_vote
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_scam_score();
```

---

## 🔄 How It Works

### Vote Flow Diagram

```
Frontend User
    │
    └─→ Submits Vote (packageId, userAddress, voteType)
           │
           └─→ POST /votes
                  │
                  ├─→ Fetch package name from Sui blockchain
                  │
                  ├─→ Upsert package record (if new)
                  │
                  ├─→ Insert vote into `votes` table
                  │
                  └─→ PostgreSQL Trigger fires
                       │
                       └─→ Recalculates scam_score for the package
                              │
                              └─→ Updates packages.scam_score
                                    │
                                    └─→ Frontend can now query fresh score
```

### Reputation Check Flow Diagram

```
Frontend App
    │
    └─→ Query Package Reputation (packageId)
           │
           └─→ POST /check-reputation
                  │
                  ├─→ Lookup package in database
                  │
                  ├─→ Check: is_verified = TRUE?
                  │   ├─ YES → Return status: LEGIT_OFFICIAL (confidence: 100%)
                  │   └─ NO  → Apply scoring logic
                  │
                  ├─→ If scam_score < -50 → SCAM_VERIFIED
                  │
                  ├─→ If scam_score < -5 → DUBIOUS
                  │
                  ├─→ If scam_score > 50 → LEGIT_VERIFIED
                  │
                  └─→ Else → UNKNOWN
                       │
                       └─→ Return status + confidence + name
```

---

## 👥 Team Collaboration Guide

### For Frontend Developers

#### Import the API Client

```javascript
// api/suiWalletClient.js
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const checkReputation = async (packageId) => {
  const response = await fetch(`${BASE_URL}/check-reputation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId })
  });
  return response.json();
};

export const submitVote = async (packageId, userAddress, voteType) => {
  const response = await fetch(`${BASE_URL}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId, userAddress, voteType })
  });
  return response.json();
};
```

#### Display Reputation UI

```javascript
// components/ReputationBadge.jsx
import { checkReputation } from '../api/suiWalletClient';

export function ReputationBadge({ packageId }) {
  const [reputation, setReputation] = useState(null);

  useEffect(() => {
    checkReputation(packageId).then(setReputation);
  }, [packageId]);

  if (!reputation) return <span>Loading...</span>;

  const statusColors = {
    SCAM_VERIFIED: '#ff4444',
    DUBIOUS: '#ffaa00',
    LEGIT_VERIFIED: '#44ff44',
    LEGIT_OFFICIAL: '#00aa00',
    UNKNOWN: '#cccccc'
  };

  return (
    <div style={{ 
      backgroundColor: statusColors[reputation.status],
      padding: '8px 12px',
      borderRadius: '4px'
    }}>
      {reputation.status} ({reputation.confidence}% confidence)
    </div>
  );
}
```

#### Handle Voting

```javascript
// components/VoteButton.jsx
import { submitVote } from '../api/suiWalletClient';

export function VoteButton({ packageId, userAddress }) {
  const handleVote = async (voteType) => {
    try {
      const result = await submitVote(packageId, userAddress, voteType);
      if (result.success) {
        alert('✅ Vote recorded!');
        // Refresh reputation
        window.location.reload();
      }
    } catch (error) {
      alert(`❌ ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={() => handleVote('legit')}>👍 Legit</button>
      <button onClick={() => handleVote('scam')}>⚠️ Scam</button>
    </div>
  );
}
```

### For Backend Developers

#### Modifying API Endpoints

**Remember the naming convention:**
- Always use **camelCase** in `req.body` destructuring
- Always use **snake_case** when writing to Supabase
- Map between them explicitly

```javascript
// ✅ CORRECT
const { packageId, userAddress } = req.body;
await supabase.from('packages').insert({
  package_id: packageId,    // Map to snake_case
  user_address: userAddress  // Map to snake_case
});

// ❌ WRONG - Don't mix naming conventions
const { package_id } = req.body; // Would break frontend
```

#### Adding New Endpoints

**Template:**
```javascript
app.post('/new-endpoint', async (req, res) => {
  // 1. Validate Input (camelCase)
  const { packageId } = req.body;
  if (!packageId) {
    return res.status(400).json({ error: 'Missing packageId' });
  }

  try {
    // 2. Query Database (use snake_case)
    const { data, error } = await supabase
      .from('packages')
      .select('package_id, scam_score')
      .eq('package_id', packageId)
      .single();

    // 3. Return Response (camelCase)
    res.json({ success: true, packageId });

  } catch (e) {
    console.error('API Error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

#### Testing Endpoints Locally

```bash
# Test Check Reputation
curl -X POST http://localhost:8080/check-reputation \
  -H "Content-Type: application/json" \
  -d '{"packageId":"0x1a2b3c4d5e6f7g8h9i0j"}'

# Test Submit Vote
curl -X POST http://localhost:8080/votes \
  -H "Content-Type: application/json" \
  -d '{"packageId":"0x1a2b3c4d5e6f7g8h9i0j","userAddress":"0x9j8i7h6g5f4e3d2c1b0a","voteType":"scam"}'

# Test Verify Package
curl -X POST http://localhost:8080/verify \
  -H "Content-Type: application/json" \
  -d '{"packageId":"0x1a2b3c4d5e6f7g8h9i0j","source":"OfficialDevTeam"}'
```

---

## 🐛 Debugging Tips

### Issue: "Missing packageId"
**Cause**: Frontend sending `package_id` instead of `packageId`
**Fix**: Use camelCase in API requests

### Issue: "Database lookup failed"
**Cause**: Supabase URL or key is incorrect
**Fix**: Verify `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`

### Issue: "User has already voted"
**Cause**: Database constraint prevents duplicate votes from same user
**Fix**: This is intentional. Show user they've already voted on this package.

### Issue: "Error fetching name from Sui"
**Cause**: Network issue or invalid packageId
**Fix**: Check that packageId is a valid Sui object address

---

## 📚 Resources

- **Express.js Documentation**: https://expressjs.com/
- **Supabase Documentation**: https://supabase.com/docs
- **Sui Developer Docs**: https://docs.sui.io/
- **Sui SDK Reference**: https://sdk.mysten.labs/

---

## 📝 License

ISC License - See `package.json` for details.

---

## 🤝 Contributing

1. Follow the naming conventions (camelCase for JS, snake_case for DB)
2. Test new endpoints locally before pushing
3. Add error handling for all API endpoints
4. Document new endpoints in this README
5. Keep the `.env` file secure and out of version control

---

**Happy building! 🚀**
