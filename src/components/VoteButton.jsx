import { useState } from 'react';
import { submitVote } from '../api/suiWalletClient';

function VoteButton({ packageId, userAddress, onVoteSuccess }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVote = async (voteType) => {
    setLoading(true);
    setMessage('');
    
    try {
      const result = await submitVote(packageId, userAddress, voteType);
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        // Call parent callback to refresh reputation
        if (onVoteSuccess) {
          setTimeout(() => onVoteSuccess(), 1000);
        }
      } else {
        setMessage(`⚠️ ${result.message}`);
      }
    } catch (error) {
      console.error('Vote error:', error);
      
      // Handle duplicate vote (409)
      if (error.response?.status === 409) {
        setMessage('⚠️ You have already voted for this package.');
      } else {
        setMessage(`❌ ${error.response?.data?.message || error.message || 'Vote failed'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <button
          onClick={() => handleVote('legit')}
          disabled={loading}
          className={`flex-1 bg-green-600 py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? '...' : '👍 Legit'}
        </button>
        <button
          onClick={() => handleVote('scam')}
          disabled={loading}
          className={`flex-1 bg-red-600 py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? '...' : '⚠️ Scam'}
        </button>
      </div>
      
      {message && (
        <p className="text-center text-sm bg-gray-800/50 p-2 rounded">{message}</p>
      )}
    </div>
  );
}

export default VoteButton;