import { ConnectButton } from '@mysten/dapp-kit';

function MobileWalletButton() {
    return (
        <div className="relative">
            <ConnectButton
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            />
        </div>
    );
}


export default MobileWalletButton;