import { useState, useEffect } from 'react';
import {
    useCurrentAccount,
    useConnectWallet,
    useDisconnectWallet,
    useWallets
} from '@mysten/dapp-kit';

function MobileWalletButton() {
    const account = useCurrentAccount();
    const { mutate: connect } = useConnectWallet();
    const { mutate: disconnect } = useDisconnectWallet();
    const wallets = useWallets();
    const [showWalletList, setShowWalletList] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Prepare list of wallets to display
    const getDisplayWallets = () => {
        if (!isMobile) return wallets;

        const mobileWallets = [...wallets];

        // Ensure Slush (formerly Sui Wallet) is in the list for mobile
        if (!mobileWallets.find(w => w.name.toLowerCase().includes('slush') || w.name.toLowerCase().includes('sui wallet'))) {
            mobileWallets.push({
                name: 'Slush',
                icon: 'https://slush.app/favicon.ico',
                isFallback: true
            });
        }

        // Ensure Phantom is in the list for mobile
        if (!mobileWallets.find(w => w.name.toLowerCase().includes('phantom'))) {
            mobileWallets.push({
                name: 'Phantom',
                icon: 'https://phantom.app/favicon.ico',
                isFallback: true
            });
        }

        return mobileWallets;
    };

    const displayWallets = getDisplayWallets();


    // Detect if user is on mobile
    useEffect(() => {
        const checkMobile = () => {
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
            setIsMobile(mobile);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-detect mobile wallet apps
    const detectMobileWallet = () => {
        const userAgent = navigator.userAgent.toLowerCase();

        // Check if inside Slush/Sui Wallet mobile app
        if (userAgent.includes('suiwallet') || userAgent.includes('slush')) {
            return 'Slush';
        }

        // Check if inside Phantom mobile app
        if (userAgent.includes('phantom')) {
            return 'Phantom';
        }

        return null;
    };

    // Handle wallet connection
    const handleConnect = (wallet) => {
        console.log('🔌 Attempting to connect to:', wallet.name);
        const walletNameLower = wallet.name.toLowerCase();

        // For mobile, try to open the wallet app
        if (isMobile) {
            // Slush/Sui Wallet deep link
            if (walletNameLower.includes('slush') || walletNameLower.includes('sui wallet')) {
                // Try the Slush/Sui Wallet deep link
                const encodedUrl = encodeURIComponent(window.location.href);

                // Try multiple deep link formats
                const deepLinks = [
                    `slush://dapp?url=${encodedUrl}`,
                    `suiwallet://dapp?url=${encodedUrl}`,
                    `https://slush.app/browse?url=${encodedUrl}`
                ];

                // Try the first deep link
                window.location.href = deepLinks[0];

                // Fallback: try to connect directly after a short delay
                setTimeout(() => {
                    if (!wallet.isFallback) {
                        connect({ wallet });
                    }
                }, 1500);
            }
            // Phantom deep link
            else if (walletNameLower.includes('phantom')) {
                const encodedUrl = encodeURIComponent(window.location.href);
                const deepLink = `https://phantom.app/ul/browse/${encodedUrl}?cluster=mainnet`;
                window.location.href = deepLink;

                setTimeout(() => {
                    if (!wallet.isFallback) {
                        connect({ wallet });
                    }
                }, 1500);
            }
            // Other wallets
            else {
                // Only try to connect if it's a real wallet adapter (has features/accounts or not a fallback)
                if (!wallet.isFallback) {
                    connect({ wallet });
                }
            }
        } else {
            // Desktop: normal connection
            connect({ wallet });
        }

        setShowWalletList(false);
    };

    // If already connected, show disconnect button
    if (account) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-mono text-white">
                            {account.address.slice(0, 6)}...{account.address.slice(-4)}
                        </span>
                    </div>
                    <button
                        onClick={() => disconnect()}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/30"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    // Show detected mobile wallet
    const mobileWallet = detectMobileWallet();
    if (mobileWallet && !showWalletList) {
        return (
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => setShowWalletList(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    Connect {mobileWallet}
                </button>
                <p className="text-xs text-gray-400 text-center">
                    Detected: {mobileWallet}
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Connect Button */}
            {!showWalletList ? (
                <button
                    onClick={() => setShowWalletList(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    {isMobile ? '📱 Connect Mobile Wallet' : '🔌 Connect Wallet'}
                </button>
            ) : (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">
                                {isMobile ? 'Connect Mobile Wallet' : 'Connect Wallet'}
                            </h3>
                            <button
                                onClick={() => setShowWalletList(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Mobile Instructions */}
                        {isMobile && (
                            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                <p className="text-sm text-blue-300">
                                    📱 Make sure you have Slush or Phantom app installed on your device
                                </p>
                            </div>
                        )}

                        {/* Wallet List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {displayWallets.length > 0 ? (
                                displayWallets.map((wallet) => (
                                    <button
                                        key={wallet.name}
                                        onClick={() => handleConnect(wallet)}
                                        className="w-full flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 hover:border-blue-500"
                                    >
                                        {wallet.icon && (
                                            <img
                                                src={wallet.icon}
                                                alt={wallet.name}
                                                className="w-8 h-8 rounded"
                                            />
                                        )}
                                        <div className="flex-1 text-left">
                                            <p className="text-white font-semibold">{wallet.name}</p>
                                            {isMobile && (
                                                <p className="text-xs text-gray-400">
                                                    Tap to open app
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 mb-4">No wallets detected</p>
                                    {isMobile ? (
                                        <div className="space-y-2">
                                            <a
                                                href="https://apps.apple.com/app/slush-sui-wallet/id6451566835"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block bg-blue-600 text-white px-4 py-2 rounded-lg"
                                            >
                                                📱 Download Slush (iOS)
                                            </a>
                                            <a
                                                href="https://play.google.com/store/apps/details?id=com.mystenlabs.slush"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block bg-green-600 text-white px-4 py-2 rounded-lg"
                                            >
                                                📱 Download Slush (Android)
                                            </a>
                                            <a
                                                href="https://phantom.app/download"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block bg-purple-600 text-white px-4 py-2 rounded-lg"
                                            >
                                                👻 Download Phantom
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <a
                                                href="https://chromewebstore.google.com/detail/slush-a-sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-blue-400 hover:text-blue-300"
                                            >
                                                Install Slush Extension
                                            </a>
                                            <a
                                                href="https://phantom.app/download"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-purple-400 hover:text-purple-300"
                                            >
                                                Install Phantom Extension
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MobileWalletButton;