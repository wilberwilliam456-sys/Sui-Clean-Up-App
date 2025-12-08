function ReputationBadge({ reputation }) {
  const statusConfig = {
    SCAM_VERIFIED: {
      bg: 'bg-red-500/80',
      icon: '🚨',
      label: 'VERIFIED SCAM',
      description: 'Multiple community reports confirm this is malicious'
    },
    DUBIOUS: {
      bg: 'bg-yellow-500/80',
      icon: '⚠️',
      label: 'SUSPICIOUS',
      description: 'Some community members flagged this as potentially unsafe'
    },
    LEGIT_VERIFIED: {
      bg: 'bg-green-500/80',
      icon: '✅',
      label: 'COMMUNITY VERIFIED',
      description: 'Community consensus confirms this is legitimate'
    },
    LEGIT_OFFICIAL: {
      bg: 'bg-green-700/80',
      icon: '🛡️',
      label: 'OFFICIALLY VERIFIED',
      description: 'Verified by trusted source'
    },
    UNKNOWN: {
      bg: 'bg-gray-500/80',
      icon: '❓',
      label: 'UNKNOWN',
      description: 'No community data available yet'
    },
  };

  const config = statusConfig[reputation.status] || statusConfig.UNKNOWN;

  return (
    <div className={`${config.bg} p-5 rounded-lg text-white space-y-2 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <p className="font-bold text-lg">{config.label}</p>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
          {reputation.confidence}% confidence
        </div>
      </div>
      
      <p className="text-sm opacity-90">{config.description}</p>
      
      <div className="pt-2 border-t border-white/20">
        <p className="text-sm">
          <span className="opacity-75">Package:</span> <span className="font-mono">{reputation.name}</span>
        </p>
        <p className="text-xs opacity-60 mt-1 break-all">
          ID: {reputation.packageId}
        </p>
      </div>
    </div>
  );
}

export default ReputationBadge;