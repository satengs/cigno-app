/**
 * Abstract AI Provider Class
 * Defines the interface for AI service providers
 */
export default class AIProvider {
  constructor(config = {}) {
    if (this.constructor === AIProvider) {
      throw new Error('AIProvider is an abstract class and cannot be instantiated directly');
    }
    
    this.config = config;
    this.isInitialized = false;
  }

  /**
   * Initialize the AI provider
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initialize() {
    throw new Error('initialize() method must be implemented by subclass');
  }

  /**
   * Check if the AI provider is available and ready
   * @returns {boolean} True if provider is available
   */
  isAvailable() {
    throw new Error('isAvailable() method must be implemented by subclass');
  }

  /**
   * Generate AI response from messages
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Promise<string>} Generated AI response
   */
  async generate(messages) {
    throw new Error('generate() method must be implemented by subclass');
  }

  /**
   * Get provider information
   * @returns {Object} Provider metadata
   */
  getProviderInfo() {
    throw new Error('getProviderInfo() method must be implemented by subclass');
  }

  /**
   * Get provider capabilities
   * @returns {Object} Provider capabilities
   */
  getCapabilities() {
    throw new Error('getCapabilities() method must be implemented by subclass');
  }

  /**
   * Validate configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig() {
    throw new Error('validateConfig() method must be implemented by subclass');
  }

  /**
   * Get error information
   * @returns {Object|null} Error details or null if no error
   */
  getLastError() {
    throw new Error('getLastError() method must be implemented by subclass');
  }

  /**
   * Reset provider state
   */
  reset() {
    this.isInitialized = false;
  }

  /**
   * Get provider status
   * @returns {Object} Current provider status
   */
  getStatus() {
    return {
      provider: this.constructor.name,
      isInitialized: this.isInitialized,
      isAvailable: this.isAvailable(),
      hasError: !!this.getLastError(),
      lastError: this.getLastError()
    };
  }
}
