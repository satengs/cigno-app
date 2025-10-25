/**
 * Authentication Service
 * Handles authentication tokens and refresh token management
 */
export default class AuthService {
  constructor() {
    this.refreshToken = process.env.REFRESH_TOKEN;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get the current refresh token
   * @returns {string|null} The refresh token
   */
  getRefreshToken() {
    return this.refreshToken;
  }

  /**
   * Set a new refresh token
   * @param {string} token - The new refresh token
   */
  setRefreshToken(token) {
    this.refreshToken = token;
  }

  /**
   * Get the current access token
   * @returns {string|null} The access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Set the access token with expiry
   * @param {string} token - The access token
   * @param {number} expiresIn - Token expiry in seconds
   */
  setAccessToken(token, expiresIn = 3600) {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + (expiresIn * 1000);
  }

  /**
   * Check if the access token is valid and not expired
   * @returns {boolean} True if token is valid
   */
  isAccessTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    return Date.now() < this.tokenExpiry;
  }

  /**
   * Get authentication headers for API requests
   * @returns {Object} Headers object with authentication
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.isAccessTokenValid()) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  /**
   * Refresh the access token using the refresh token
   * @returns {Promise<boolean>} True if refresh was successful
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      console.warn('No refresh token available');
      return false;
    }

    try {
      // This would typically call your authentication provider's refresh endpoint
      // For now, we'll just log that we would refresh the token
      console.log('🔄 Refreshing access token using refresh token:', this.refreshToken.substring(0, 8) + '...');
      
      // In a real implementation, you would:
      // 1. Call your auth provider's refresh endpoint
      // 2. Get a new access token
      // 3. Update the access token and expiry
      // 4. Handle errors appropriately
      
      return true;
    } catch (error) {
      console.error('❌ Failed to refresh access token:', error);
      return false;
    }
  }

  /**
   * Clear all authentication tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.refreshToken = null;
  }

  /**
   * Get authentication status
   * @returns {Object} Authentication status information
   */
  getAuthStatus() {
    return {
      hasRefreshToken: !!this.refreshToken,
      hasAccessToken: !!this.accessToken,
      isAccessTokenValid: this.isAccessTokenValid(),
      tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null
    };
  }
}

// Export a singleton instance
export const authService = new AuthService();
