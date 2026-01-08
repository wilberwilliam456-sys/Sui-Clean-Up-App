import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { checkReputation } from '../api/suiWalletClient';
import ReputationBadge from '../components/ReputationBadge';
import VoteButton from '../components/VoteButton';
import VerifyForm from '../components/VerifyForm';
import MobileWalletButton from '../components/MobileWalletButton'; // NEW

function Home() {
  const [packageId, setPackageId] = useState('');
  const [reputation, setReputation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const account = useCurrentAccount();
  const userAddress = account?.address;

  useEffect(() => {
    if (account) {
      console.log('✅ Wallet connected:', account.address);
    }
  }, [account]);

  const handleCheck = async () => {
    if (!packageId.trim()) {
      setError('Please enter a Package ID');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await checkReputation(packageId);
      setReputation(data);
    } catch (err) {
      console.error('Reputation check error:', err);
      setError('Failed to check reputation: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="glass-card p-6 md:p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sui-blue to-purple-400 text-center">
            Sui Security Checker
          </h1>

          {/* Mobile-Optimized Connect Button */}
          <MobileWalletButton />
        </div>

        {/* Package ID Input */}
        <div className="mb-4 p-3 bg-gray-800/30 rounded-lg">
          <input
            type="text"
            placeholder="Enter Package ID (e.g., 0x2)"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full p-3 bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm md:text-base"
          />
        </div>

        {/* Check Button */}
        <button
          onClick={handleCheck}
          disabled={loading}
          className={`w-full bg-gradient-to-r from-sui-blue to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold ${loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {loading ? '🔄 Checking...' : '🔍 Check Reputation'}
        </button>

        {error && (
          <p className="text-red-400 mt-4 text-center bg-red-900/20 p-2 rounded text-sm">
            {error}
          </p>
        )}

        {reputation && (
          <div className="mt-6 space-y-4">
            <ReputationBadge reputation={reputation} />

            {userAddress ? (
              <VoteButton
                packageId={packageId}
                userAddress={userAddress}
                onVoteSuccess={() => handleCheck()}
              />
            ) : (
              <div className="text-yellow-400 text-center italic bg-yellow-900/20 p-3 rounded border border-yellow-500/30 text-sm">
                <p className="mb-2">💡 Connect your wallet to vote</p>
              </div>
            )}
          </div>
        )}

        {import.meta.env.MODE === 'development' && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <h2 className="text-xl mb-4 text-purple-300">🔧 Admin: Verify Package</h2>
            <VerifyForm packageId={packageId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;