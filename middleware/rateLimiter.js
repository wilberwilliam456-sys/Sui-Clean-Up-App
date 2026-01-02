class RateLimiter {
  constructor() {
    // Store rate limit data in memory
    // In production, use Redis for distributed systems
    this.addressLimits = new Map();
    this.ipLimits = new Map();
    
    // Clean up old entries every hour
    setInterval(() => this.cleanup(), 3600000);
  }

  cleanup() {
    const now = Date.now();
    const oneHour = 3600000;
    const oneDay = 86400000;

    // Clean address limits (1 hour window)
    for (const [key, value] of this.addressLimits.entries()) {
      if (now - value.timestamp > oneHour) {
        this.addressLimits.delete(key);
      }
    }

    // Clean IP limits (24 hour window)
    for (const [key, value] of this.ipLimits.entries()) {
      if (now - value.reset > oneDay) {
        this.ipLimits.delete(key);
      }
    }
  }

  checkAddressLimit(userAddress) {
    const now = Date.now();
    const oneHour = 3600000; // 1 hour in milliseconds
    
    const addressKey = `addr:${userAddress}`;
    const limitData = this.addressLimits.get(addressKey);

    if (limitData) {
      const timeSinceLastVote = now - limitData.timestamp;
      
      if (timeSinceLastVote < oneHour) {
        const remainingTime = Math.ceil((oneHour - timeSinceLastVote) / 60000); // minutes
        return {
          allowed: false,
          remainingTime,
          message: `Please wait ${remainingTime} minutes before voting again from this address.`
        };
      }
    }

    // Update timestamp
    this.addressLimits.set(addressKey, { timestamp: now });
    return { allowed: true };
  }

  checkIPLimit(ipAddress) {
    const now = Date.now();
    const oneDay = 86400000; // 24 hours in milliseconds
    
    const ipKey = `ip:${ipAddress}`;
    const limitData = this.ipLimits.get(ipKey) || { count: 0, reset: now };

    // Reset counter if 24 hours have passed
    if (now - limitData.reset >= oneDay) {
      limitData.count = 0;
      limitData.reset = now;
    }

    // Check if limit exceeded (5 votes per IP per day)
    if (limitData.count >= 5) {
      const hoursRemaining = Math.ceil((oneDay - (now - limitData.reset)) / 3600000);
      return {
        allowed: false,
        message: `Daily vote limit reached. Please try again in ${hoursRemaining} hours.`
      };
    }

    // Increment counter
    limitData.count++;
    this.ipLimits.set(ipKey, limitData);
    
    return { 
      allowed: true,
      remaining: 5 - limitData.count 
    };
  }

  // Middleware function for Express
  middleware() {
    return (req, res, next) => {
      const { userAddress } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Check address limit
      if (userAddress) {
        const addressCheck = this.checkAddressLimit(userAddress);
        if (!addressCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: addressCheck.message
          });
        }
      }

      // Check IP limit
      const ipCheck = this.checkIPLimit(ipAddress);
      if (!ipCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: ipCheck.message
        });
      }

      // Add remaining votes info to request
      req.rateLimitInfo = {
        remaining: ipCheck.remaining
      };

      next();
    };
  }
}

export default new RateLimiter();