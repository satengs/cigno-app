/**
 * API Key Management System
 * Handles authentication for external chat connections
 */
export default class ApiKeyManager {
  constructor() {
    // In production, store these in environment variables or database
    this.apiKeys = new Map([
      ['d8888197b6edf249bfa0c8dd7ec1af7176d273529802c39ecdd79eb1324065c4', {
        name: 'Production Widget',
        permissions: ['chat:read', 'chat:write'],
        rateLimit: 100, // messages per hour
        createdAt: '2024-01-01T00:00:00Z',
        lastUsed: null,
        isActive: true
      }],
      ['d4abe60bb87d3f6156285c0e0341ccb7965b387638cab06ed4f7d8566e9b3111', {
        name: 'Development Widget',
        permissions: ['chat:read', 'chat:write'],
        rateLimit: 500, // higher limit for dev
        createdAt: '2024-01-01T00:00:00Z',
        lastUsed: null,
        isActive: true
      }],
      ['ca4f82e78deb36a4d3ebdbf9d22de6db72e2eb9705097a4e0074a3742c746b29', {
        name: 'Consultant Access',
        permissions: ['chat:read', 'chat:write', 'history:read'],
        rateLimit: 200,
        createdAt: '2024-01-01T00:00:00Z',
        lastUsed: null,
        isActive: true
      }],
      ['b0d67edcba8e1554253cc96a86b3556b38be1585b14ff8b084468b7646d0180b', {
        name: 'Manager Dashboard',
        permissions: ['chat:read', 'chat:write', 'history:read', 'stats:read'],
        rateLimit: 300,
        createdAt: '2024-01-01T00:00:00Z',
        lastUsed: null,
        isActive: true
      }]
    ]);

    // Track usage for rate limiting
    this.usageTracking = new Map(); // apiKey -> { count, resetTime }
  }

  /**
   * Validate API key
   * @param {string} apiKey - API key to validate
   * @returns {Object|null} API key info or null if invalid
   */
  validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return null;
    }

    const keyInfo = this.apiKeys.get(apiKey);
    if (!keyInfo || !keyInfo.isActive) {
      return null;
    }

    // Update last used timestamp
    keyInfo.lastUsed = new Date().toISOString();
    
    return {
      apiKey,
      ...keyInfo
    };
  }

  /**
   * Check if API key has specific permission
   * @param {string} apiKey - API key
   * @param {string} permission - Permission to check
   * @returns {boolean} True if permission granted
   */
  hasPermission(apiKey, permission) {
    const keyInfo = this.apiKeys.get(apiKey);
    return keyInfo && keyInfo.isActive && keyInfo.permissions.includes(permission);
  }

  /**
   * Check rate limit for API key
   * @param {string} apiKey - API key
   * @returns {Object} Rate limit status
   */
  checkRateLimit(apiKey) {
    const keyInfo = this.apiKeys.get(apiKey);
    if (!keyInfo) {
      return { allowed: false, reason: 'Invalid API key' };
    }

    const now = Date.now();
    const resetTime = now + (60 * 60 * 1000); // 1 hour from now
    
    let usage = this.usageTracking.get(apiKey);
    
    if (!usage || now > usage.resetTime) {
      // Reset or initialize usage
      usage = { count: 0, resetTime };
      this.usageTracking.set(apiKey, usage);
    }

    if (usage.count >= keyInfo.rateLimit) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        limit: keyInfo.rateLimit,
        current: usage.count,
        resetTime: usage.resetTime
      };
    }

    // Increment usage
    usage.count++;

    return {
      allowed: true,
      limit: keyInfo.rateLimit,
      current: usage.count,
      resetTime: usage.resetTime
    };
  }

  /**
   * Get API key statistics
   * @returns {Array} Array of API key stats
   */
  getStats() {
    const stats = [];
    
    this.apiKeys.forEach((keyInfo, apiKey) => {
      const usage = this.usageTracking.get(apiKey);
      stats.push({
        name: keyInfo.name,
        apiKey: apiKey.substring(0, 8) + '...' + apiKey.substring(-8), // Masked key
        permissions: keyInfo.permissions,
        rateLimit: keyInfo.rateLimit,
        currentUsage: usage ? usage.count : 0,
        lastUsed: keyInfo.lastUsed,
        isActive: keyInfo.isActive,
        createdAt: keyInfo.createdAt
      });
    });

    return stats;
  }

  /**
   * Generate new API key
   * @param {Object} config - API key configuration
   * @returns {string} New API key
   */
  generateApiKey(config) {
    const apiKey = this.generateRandomKey();
    
    this.apiKeys.set(apiKey, {
      name: config.name || 'Unnamed Key',
      permissions: config.permissions || ['chat:read', 'chat:write'],
      rateLimit: config.rateLimit || 100,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true
    });

    return apiKey;
  }

  /**
   * Revoke API key
   * @param {string} apiKey - API key to revoke
   * @returns {boolean} True if revoked successfully
   */
  revokeApiKey(apiKey) {
    const keyInfo = this.apiKeys.get(apiKey);
    if (keyInfo) {
      keyInfo.isActive = false;
      this.usageTracking.delete(apiKey);
      return true;
    }
    return false;
  }

  /**
   * Generate random API key
   * @returns {string} Random API key
   */
  generateRandomKey() {
    const length = 64;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clean up expired usage tracking
   */
  cleanupExpiredUsage() {
    const now = Date.now();
    this.usageTracking.forEach((usage, apiKey) => {
      if (now > usage.resetTime) {
        this.usageTracking.delete(apiKey);
      }
    });
  }
}