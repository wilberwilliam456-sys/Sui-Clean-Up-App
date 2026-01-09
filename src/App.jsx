import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Shield, Search, Info } from 'lucide-react';
import { checkReputation } from './api/suiWalletClient';
import MobileWalletButton from './components/MobileWalletButton';
import ReputationBadge from './components/ReputationBadge';
import VoteButton from './components/VoteButton';
import VerifyForm from './components/VerifyForm';

function App() {
  const account = useCurrentAccount();
  const [packageId, setPackageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [reputation, setReputation] = useState(null);
  const [error, setError] = useState('');
  const [showVerify, setShowVerify] = useState(false);

  const handleCheck = async (e) => {
    e?.preventDefault();
    if (!packageId.trim()) return;

    setLoading(true);
    setError('');
    setReputation(null);

    try {
      const data = await checkReputation(packageId.trim());
      setReputation(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to check reputation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Sui Security
              </h1>
              <p className="text-sm text-slate-400">Community Trust Layer</p>
            </div>
          </div>
          <MobileWalletButton />
        </header>

        {/* Main Search Area */}
        <main className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Search Box */}
            <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Check Package Safety</h2>
              <form onSubmit={handleCheck} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Package ID (Object ID)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                      type="text"
                      value={packageId}
                      onChange={(e) => setPackageId(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !packageId}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20"
                >
                  {loading ? 'Analyzing...' : 'Check Reputation'}
                </button>
              </form>
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Official Verification Toggle */}
            <div className="bg-slate-800/30 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
              <button
                onClick={() => setShowVerify(!showVerify)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <Info className="w-4 h-4" />
                <span className="text-sm">Verify a package as official owner</span>
              </button>
              {showVerify && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <VerifyForm packageId={packageId} />
                </div>
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-6">
            {reputation ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <ReputationBadge reputation={reputation} />

                {account ? (
                  <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Cast Your Vote</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      Help the community by voting on this package's safety.
                    </p>
                    <VoteButton
                      packageId={reputation.packageId}
                      userAddress={account.address}
                      onVoteSuccess={() => handleCheck()}
                    />
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-slate-600 rounded-2xl text-center text-slate-400 bg-slate-800/20">
                    Connect wallet to vote on this package
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/10 text-slate-500">
                <div className="text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a package ID to view community trust score</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;