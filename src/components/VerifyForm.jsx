import { useState } from 'react';
import { verifyPackage } from '../api/suiWalletClient';

function VerifyForm({ packageId }) {
  const [source, setSource] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerify = async () => {
    if (!packageId?.trim()) {
      setMessage('⚠️ Provide a package ID first.');
      setIsSuccess(false);
      return;
    }
    
    if (!source.trim()) {
      setMessage('⚠️ Please enter the source/official owner.');
      setIsSuccess(false);
      return;
    }
    
    setMessage('');
    setLoading(true);
    setIsSuccess(false);
    
    try {
      const result = await verifyPackage(packageId, source);
      setMessage(`✅ ${result?.message || 'Verification submitted successfully.'}`);
      setIsSuccess(true);
      setSource(''); // Clear form on success
    } catch (err) {
      console.error('verifyPackage error:', err);
      setMessage(`❌ ${err.message || 'Verification failed. Please try again.'}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Source (e.g., OfficialDevTeam)"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
      />
      
      <button
        onClick={handleVerify}
        disabled={loading}
        className={`w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? '⏳ Verifying...' : '✓ Verify Package'}
      </button>
      
      {message && (
        <p className={`text-center text-sm p-2 rounded ${
          isSuccess ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default VerifyForm;