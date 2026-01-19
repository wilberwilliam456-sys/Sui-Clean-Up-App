import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

class WalletValidator {
  constructor() {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
    this.cache = new Map(); // Cache validation results for 5 minutes
    this.cacheTimeout = 300000; // 5 minutes
  }

  async validateWallet(userAddress) {
    // Check cache first
    const cached = this.cache.get(userAddress);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    try {
      // 1. Check if wallet has any transaction history
      const transactions = await this.suiClient.queryTransactionBlocks({
        filter: { FromAddress: userAddress },
        limit: 1,
      });

      if (!transactions.data || transactions.data.length === 0) {
        return {
          valid: false,
          reason: 'NO_TRANSACTIONS',
          message: 'Wallet must have at least 1 transaction to vote. This prevents spam from newly created wallets.'
        };
      }

      // 2. Check wallet balance (minimum 0.001 SUI = 1,000,000 MIST)
      const balance = await this.suiClient.getBalance({
        owner: userAddress,
      });

      const minBalance = 1000000; // 0.001 SUI in MIST
      const currentBalance = parseInt(balance.totalBalance);

      if (currentBalance < minBalance) {
        return {
          valid: false,
          reason: 'INSUFFICIENT_BALANCE',
          message: `Wallet must hold at least 0.001 SUI to vote. Current balance: ${(currentBalance / 1e9).toFixed(4)} SUI`
        };
      }

      // 3. Check wallet age
      // We query the FIRST transaction ever made by this address (ascending order)
      const oldestTransaction = await this.suiClient.queryTransactionBlocks({
        filter: { FromAddress: userAddress },
        limit: 1,
        order: 'ascending'
      });

      if (oldestTransaction.data && oldestTransaction.data.length > 0) {
        const firstTx = oldestTransaction.data[0];
        if (firstTx.timestampMs) {
          const walletAge = Date.now() - parseInt(firstTx.timestampMs);
          const minAge = 24 * 60 * 60 * 1000; // 24 hours

          if (walletAge < minAge) {
            const hoursOld = (walletAge / (60 * 60 * 1000)).toFixed(1);
            return {
              valid: false,
              reason: 'WALLET_TOO_NEW',
              message: `Wallet must be at least 24 hours old to vote. Your wallet is only ${hoursOld} hours old.`
            };
          }
        }
      }

      // Wallet is valid
      const result = {
        valid: true,
        message: 'Wallet validated successfully',
        stats: {
          transactionCount: transactions.data.length,
          balance: (currentBalance / 1e9).toFixed(4) + ' SUI'
        }
      };

      // Cache the result
      this.cache.set(userAddress, {
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Wallet validation error:', error);

      // If it's a network error, allow the vote but log the issue
      return {
        valid: true,
        warning: 'Could not fully validate wallet due to network issues. Vote allowed.',
        error: error.message
      };
    }
  }

  // Middleware function for Express
  middleware() {
    return async (req, res, next) => {
      const { userAddress } = req.body;

      if (!userAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing userAddress'
        });
      }

      // Validate Sui address format (0x followed by 64 hex characters)
      const addressRegex = /^0x[a-fA-F0-9]{64}$/;
      if (!addressRegex.test(userAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Sui address format'
        });
      }

      try {
        const validation = await this.validateWallet(userAddress);

        if (!validation.valid) {
          return res.status(403).json({
            success: false,
            error: 'Wallet validation failed',
            reason: validation.reason,
            message: validation.message
          });
        }

        // Add validation info to request
        req.walletValidation = validation;
        next();

      } catch (error) {
        console.error('Wallet validation middleware error:', error);
        // In case of errors, log but allow the request to proceed
        req.walletValidation = { valid: true, warning: error.message };
        next();
      }
    };
  }

  // Clear cache manually if needed
  clearCache() {
    this.cache.clear();
  }
}

export default new WalletValidator();