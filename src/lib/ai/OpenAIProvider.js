import AIProvider from './AIProvider.js';

/**
 * OpenAI Provider Implementation
 * Handles communication with OpenAI's API
 */
export default class OpenAIProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || 'gpt-3.5-turbo';
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.7;
    this.lastError = null;
  }

  /**
   * Initialize the OpenAI provider
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initialize() {
    try {
      if (!this.validateConfig()) {
        throw new Error('Invalid configuration');
      }

      // Test API key by making a simple request
      if (this.apiKey) {
        // In a real implementation, you might test the API key here
        // For now, we'll just check if it exists
        this.isInitialized = true;
        this.lastError = null;
        return true;
      } else {
        throw new Error('OpenAI API key not provided');
      }
    } catch (error) {
      this.lastError = {
        message: error.message,
        timestamp: new Date().toISOString(),
        type: 'initialization'
      };
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Check if the OpenAI provider is available and ready
   * @returns {boolean} True if provider is available
   */
  isAvailable() {
    return this.isInitialized && !!this.apiKey && !this.lastError;
  }

  /**
   * Generate AI response from messages
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Promise<string>} Generated AI response
   */
  async generate(messages) {
    try {
      if (!this.isAvailable()) {
        throw new Error('OpenAI provider is not available');
      }

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Invalid messages array provided');
      }

      // Format messages for OpenAI API
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // In a real implementation, this would make an actual API call
      // For now, we'll simulate the response based on the conversation
      const response = await this.simulateOpenAIResponse(formattedMessages);
      
      this.lastError = null;
      return response;

    } catch (error) {
      this.lastError = {
        message: error.message,
        timestamp: new Date().toISOString(),
        type: 'generation'
      };
      throw error;
    }
  }

  /**
   * Simulate OpenAI API response (for development/testing)
   * @param {Array} messages - Formatted messages
   * @returns {Promise<string>} Simulated response
   */
  async simulateOpenAIResponse(messages) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const lastUserMessage = messages.find(msg => msg.role === 'user');
    if (!lastUserMessage) {
      return "I'm here to help! What would you like to know?";
    }

    const userContent = lastUserMessage.content.toLowerCase();
    
    // Context-aware responses based on conversation
    if (userContent.includes('dashboard') || userContent.includes('widget')) {
      return "I can help you with dashboard and widget questions! The dashboard system supports various widget types including text widgets for content display, number widgets for metrics, and chart widgets for data visualization. Each widget can be customized with properties and styling options. What specific aspect would you like to learn more about?";
    }
    
    if (userContent.includes('help') || userContent.includes('assist')) {
      return "I'm here to help! I can assist you with dashboard configuration, widget management, data analysis, and general questions about the Cigno application. What would you like help with?";
    }
    
    if (userContent.includes('chart') || userContent.includes('graph')) {
      return "Charts and graphs are great for data visualization! The chart widget supports multiple types including line charts, bar charts, pie charts, and area charts. You can configure colors, legends, and data series. Would you like me to explain how to set up a specific chart type?";
    }
    
    if (userContent.includes('data') || userContent.includes('analytics')) {
      return "Data analytics is a powerful feature! You can create dashboards with various widgets to visualize your data. Number widgets are great for KPIs, charts for trends, and text widgets for insights. How can I help you get started with data visualization?";
    }
    
    if (userContent.includes('hello') || userContent.includes('hi')) {
      return "Hello! I'm your AI assistant, ready to help you with dashboard creation, widget configuration, and data analysis. How can I assist you today?";
    }
    
    if (userContent.includes('thank')) {
      return "You're very welcome! I'm happy to help. Is there anything else you'd like to know about the dashboard system or any other features?";
    }

    // Generic intelligent response
    return "I understand your question. Let me provide you with some helpful information. The Cigno dashboard system is designed to be flexible and user-friendly, allowing you to create custom dashboards with various widget types. Each widget can be configured with specific properties and styling to meet your needs. Is there a particular feature or functionality you'd like me to explain in more detail?";
  }

  /**
   * Get provider information
   * @returns {Object} Provider metadata
   */
  getProviderInfo() {
    return {
      name: 'OpenAI',
      version: '1.0.0',
      description: 'OpenAI GPT model integration for AI chat',
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }

  /**
   * Get provider capabilities
   * @returns {Object} Provider capabilities
   */
  getCapabilities() {
    return {
      supportsChat: true,
      supportsStreaming: false, // Could be enabled in future
      maxMessageLength: 4096,
      supportedModels: ['gpt-3.5-turbo', 'gpt-4'],
      features: ['conversation', 'context-awareness', 'natural-language']
    };
  }

  /**
   * Validate configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig() {
    if (!this.apiKey) {
      this.lastError = {
        message: 'OpenAI API key is required',
        timestamp: new Date().toISOString(),
        type: 'validation'
      };
      return false;
    }

    if (this.maxTokens < 1 || this.maxTokens > 4000) {
      this.lastError = {
        message: 'maxTokens must be between 1 and 4000',
        timestamp: new Date().toISOString(),
        type: 'validation'
      };
      return false;
    }

    if (this.temperature < 0 || this.temperature > 2) {
      this.lastError = {
        message: 'temperature must be between 0 and 2',
        timestamp: new Date().toISOString(),
        type: 'validation'
      };
      return false;
    }

    this.lastError = null;
    return true;
  }

  /**
   * Get error information
   * @returns {Object|null} Error details or null if no error
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Set API key
   * @param {string} apiKey - OpenAI API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.lastError = null;
    this.isInitialized = false; // Reset initialization state
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    
    if (newConfig.apiKey) {
      this.apiKey = newConfig.apiKey;
    }
    if (newConfig.model) {
      this.model = newConfig.model;
    }
    if (newConfig.maxTokens) {
      this.maxTokens = newConfig.maxTokens;
    }
    if (newConfig.temperature) {
      this.temperature = newConfig.temperature;
    }
    
    // Reset state when config changes
    this.lastError = null;
    this.isInitialized = false;
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        throw new Error('No API key configured');
      }
      
      // In a real implementation, this would make a test API call
      // For now, we'll just validate the configuration
      return this.validateConfig();
    } catch (error) {
      this.lastError = {
        message: error.message,
        timestamp: new Date().toISOString(),
        type: 'connection-test'
      };
      return false;
    }
  }
}
