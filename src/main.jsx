// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import '@mysten/dapp-kit/dist/index.css';
import './index.css';

// Setup QueryClient for React Query
const queryClient = new QueryClient();

// Network configuration - supports mainnet, testnet, and devnet
const networks = {
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="mainnet">
        <WalletProvider
          autoConnect={true}
          enableUnsafeBurner={false}
          preferredWallets={['Suiet', 'Sui Wallet', 'Phantom']}
          storageAdapter={{
            getItem: (key) => {
              try {
                return localStorage.getItem(key);
              } catch (error) {
                console.warn('localStorage getItem error:', error);
                return null;
              }
            },
            setItem: (key, value) => {
              try {
                localStorage.setItem(key, value);
              } catch (error) {
                console.warn('localStorage setItem error:', error);
              }
            },
            removeItem: (key) => {
              try {
                localStorage.removeItem(key);
              } catch (error) {
                console.warn('localStorage removeItem error:', error);
              }
            }
          }}
        >
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);