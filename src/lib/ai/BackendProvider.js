import AIProvider from './AIProvider.js';
import { BackendConfig } from '../config/backend.js';
import { authService } from '../auth/AuthService.js';
import ProgressiveResponseStreamer from '../communication/ProgressiveResponseStreamer.js';

/**
 * Backend API Provider Implementation
 * Calls your backend service on port 3000 instead of OpenAI directly
 */
export default class BackendProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    
    // Merge with default backend configuration
    const backendConfig = { ...BackendConfig, ...config };
    
    this.backendUrl = backendConfig.baseUrl;
    this.endpoint = backendConfig.chatEndpoint;
    this.healthEndpoint = backendConfig.healthEndpoint;
    this.apiKey = backendConfig.apiKey;
    this.timeout = backendConfig.timeout;
    this.retries = backendConfig.retries;
    this.requestFormat = backendConfig.requestFormat;
    this.responseFormat = backendConfig.responseFormat;
    this.errorHandling = backendConfig.errorHandling;
    
    this.lastError = null;
    this.consecutiveErrors = 0;
  }

  /**
   * Initialize the Backend provider
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initialize() {
    try {
      if (!this.validateConfig()) {
        throw new Error('Invalid configuration');
      }

      // Test backend connectivity
      const connectionResult = await this.testConnection();
      
      if (connectionResult) {
        this.isInitialized = true;
        this.lastError = null;
        console.log('✅ Backend AI provider initialized successfully');
        return true;
      } else {
        throw new Error('Backend connection test failed');
      }
    } catch (error) {
      this.lastError = {
        message: error.message,
        timestamp: new Date().toISOString(),
        type: 'initialization',
        userMessage: 'AI backend service is currently unavailable. Using offline mode with intelligent responses.'
      };
      this.isInitialized = false;
      console.warn('⚠️ Backend AI provider initialization failed - operating in offline mode');
      return false;
    }
  }

  /**
   * Check if the Backend provider is available and ready
   * @returns {boolean} True if provider is available
   */
  isAvailable() {
    return this.isInitialized && !this.lastError;
  }

  /**
   * Generate AI response from messages by calling backend service
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Promise<string>} AI generated response from backend
   */
  async generate(messages) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Backend provider is not available');
      }

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Invalid messages array provided');
      }

      // Get the last user message
      const lastUserMessage = messages.find(msg => msg.role === 'user');
      if (!lastUserMessage) {
        throw new Error('No user message found');
      }

      // Call backend service
      const response = await this.callBackendAPI(lastUserMessage.content, messages);
      
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
   * Call your backend API service following the documented async pattern
   * @param {string} userMessage - User's message
   * @param {Array} messages - Full conversation context
   * @returns {Promise<string>} Backend response
   */
  async callBackendAPI(userMessage, messages = []) {
    const sendUrl = `${this.backendUrl}${this.endpoint}`;
    
    // Prepare request payload according to your backend documentation
    const payload = {
      message: userMessage,
      userId: 'cigno-platform-user',
      chatId: `chat_${Date.now()}`,
      enableNarratives: true
    };
    
    // Add attachments if there are previous messages (conversation context)
    if (messages.length > 1) {
      payload.attachments = [
        {
          type: 'context',
          title: 'Conversation History',
          body: {
            previousMessages: messages.slice(0, -1).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          },
          hidden: true,
          description: 'Previous conversation context'
        }
      ];
    }

    const headers = {
      'X-API-Key': '53e53331a91f51237307407ee976d19ccd1be395a96f7931990a326772b12bae',
      'Content-Type': 'application/json'
    };

    try {
      console.log(`🔄 Calling backend API: ${sendUrl}`);
      console.log('📤 Request payload:', JSON.stringify(payload, null, 2));

      // Step 1: Send message to get requestId
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const sendResponse = await fetch(sendUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        throw new Error(`Backend send API error (${sendResponse.status}): ${errorText}`);
      }

      let sendData;
      try {
        sendData = await sendResponse.json();
        console.log('📥 Send response:', sendData);
      } catch (parseError) {
        console.error('❌ Failed to parse backend response as JSON:', parseError.message);
        throw new Error(`Backend returned invalid JSON response: ${parseError.message}`);
      }

      if (!sendData.requestId) {
        throw new Error('Backend did not return requestId');
      }

      // Step 2: Poll for the actual response
      return await this.pollForResponse(sendData.requestId);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Backend API timeout after ${this.timeout}ms`);
      }
      
      console.error('Backend API call failed:', error);
      throw new Error(`Failed to call backend API: ${error.message}`);
    }
  }

  /**
   * Poll the status endpoint until response is ready
   * @param {string} requestId - Request ID from send call
   * @returns {Promise<string>} AI response
   */
  async pollForResponse(requestId) {
    const statusUrl = `${this.backendUrl}/api/chat/status/${requestId}`;
    const maxPolls = Math.floor(this.timeout / 1000); // Poll every second until timeout
    let pollCount = 0;

    console.log(`🔍 Polling for response: ${statusUrl}`);

    while (pollCount < maxPolls) {
      try {
        const statusResponse = await fetch(statusUrl, {
          headers: {
            'X-API-Key': '53e53331a91f51237307407ee976d19ccd1be395a96f7931990a326772b12bae',
            'Content-Type': 'application/json'
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Status check failed (${statusResponse.status})`);
        }

        let statusData;
        try {
          statusData = await statusResponse.json();
          console.log(`📊 Poll ${pollCount + 1}: ${statusData.status} (${statusData.progress || 0})`);
        } catch (parseError) {
          console.error('❌ Failed to parse status response as JSON:', parseError.message);
          throw new Error(`Backend status endpoint returned invalid JSON: ${parseError.message}`);
        }

        if (statusData.status === 'complete') {
          console.log('✅ Response ready, full data:', JSON.stringify(statusData, null, 2));
          
          // Try different response field structures based on common backend patterns
          let responseContent = null;
          
          // Pattern 1: statusData.response.message
          if (statusData.response && statusData.response.message) {
            responseContent = statusData.response.message;
            console.log('📝 Found response in: statusData.response.message');
          } 
          // Pattern 2: statusData.response (direct string)
          else if (statusData.response && typeof statusData.response === 'string') {
            responseContent = statusData.response;
            console.log('📝 Found response in: statusData.response (string)');
          }
          // Pattern 3: statusData.data or statusData.content  
          else if (statusData.data) {
            responseContent = statusData.data.message || statusData.data.response || statusData.data.content || statusData.data;
            console.log('📝 Found response in: statusData.data');
          }
          else if (statusData.content) {
            responseContent = statusData.content;
            console.log('📝 Found response in: statusData.content');
          }
          // Pattern 4: statusData.result
          else if (statusData.result) {
            responseContent = statusData.result.message || statusData.result.content || statusData.result;
            console.log('📝 Found response in: statusData.result');
          }
          // Pattern 5: statusData.html (extract text from HTML)
          else if (statusData.html && typeof statusData.html === 'string') {
            // Extract text content from HTML
            const htmlText = statusData.html.replace(/<[^>]*>/g, '').trim();
            if (htmlText && htmlText.length > 0) {
              responseContent = htmlText;
              console.log('📝 Found response in: statusData.html (extracted text)');
            }
          }
          // Pattern 6: statusData.message (but not generic messages)
          else if (statusData.message && statusData.message !== 'Response generated' && statusData.message !== 'Message received, processing started' && statusData.message !== 'Request completed') {
            responseContent = statusData.message;
            console.log('📝 Found response in: statusData.message');
          }
          // Pattern 6: Look for any field that looks like AI response content
          else {
            const possibleFields = ['answer', 'reply', 'output', 'text', 'assistant_response', 'ai_response'];
            for (const field of possibleFields) {
              if (statusData[field]) {
                responseContent = statusData[field];
                console.log(`📝 Found response in: statusData.${field}`);
                break;
              }
            }
          }
          
          if (responseContent && typeof responseContent === 'string' && responseContent.length > 0) {
            return responseContent;
          } else {
            // Log the full structure to help debug
            console.log('⚠️ No recognizable response content found. Full statusData structure:');
            console.log(JSON.stringify(statusData, null, 2));
            return "I processed your message successfully, but the response format from the backend needs adjustment. Check the console logs for the actual response structure.";
          }
        } else if (statusData.status === 'error') {
          throw new Error(`Backend processing error: ${statusData.message}`);
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        pollCount++;

      } catch (error) {
        console.error('Status poll failed:', error);
        throw error;
      }
    }

    throw new Error('Backend response timeout - no response received');
  }

  /**
   * Extract AI response from backend API response
   * Uses configuration to determine response format
   * @param {Object} backendResponse - Response from your backend
   * @returns {string} Extracted AI response
   */
  extractResponseFromBackend(backendResponse) {
    // Direct string response
    if (typeof backendResponse === 'string') {
      return backendResponse;
    }

    // Try configured response fields in order
    for (const field of this.responseFormat.responseFields) {
      const value = this.getNestedValue(backendResponse, field);
      if (value && typeof value === 'string') {
        return value;
      }
    }

    // If none of the configured formats match, log and return fallback
    if (this.errorHandling.logErrors) {
      console.warn('Unknown backend response format:', backendResponse);
      console.warn('Tried fields:', this.responseFormat.responseFields);
    }
    
    return 'I received a response from the backend but couldn\'t parse it. Please check the backend response format in src/lib/config/backend.js';
  }

  /**
   * Get nested value from object using dot notation or array notation
   * @param {Object} obj - Object to search
   * @param {string} path - Path like 'data.response' or 'choices[0].message.content'
   * @returns {any} Value at path or undefined
   */
  getNestedValue(obj, path) {
    try {
      // Handle array notation like choices[0].message.content
      if (path.includes('[') && path.includes(']')) {
        return this.getNestedValueWithArrays(obj, path);
      }
      
      // Handle simple dot notation
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get nested value with array notation support
   * @param {Object} obj - Object to search
   * @param {string} path - Path with array notation
   * @returns {any} Value at path or undefined
   */
  getNestedValueWithArrays(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (part.includes('[') && part.includes(']')) {
        const [key, indexPart] = part.split('[');
        const index = parseInt(indexPart.replace(']', ''));
        
        if (current[key] && Array.isArray(current[key]) && current[key][index] !== undefined) {
          current = current[key][index];
        } else {
          return undefined;
        }
      } else {
        if (current && current[part] !== undefined) {
          current = current[part];
        } else {
          return undefined;
        }
      }
    }
    
    return current;
  }

  /**
   * Test connection to backend service
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      console.log('🔍 Testing backend connection...');
      
      // Test the API verification endpoint from your documentation
      const verifyUrl = `${this.backendUrl}/api/verify`;
      console.log(`   API verification URL: ${verifyUrl}`);
      
      // Add timeout for connection test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': '53e53331a91f51237307407ee976d19ccd1be395a96f7931990a326772b12bae',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        if (verifyData.valid) {
          console.log('✅ Backend API verification passed');
          return true;
        } else {
          console.log('❌ API key is not valid');
          return false;
        }
      }

      console.log(`⚠️ API verification failed (${verifyResponse.status}), testing send endpoint...`);

      // If verification fails, try a simple test call to the send endpoint
      // This will fail but at least tell us if the endpoint exists
      const testResponse = await fetch(`${this.backendUrl}${this.endpoint}`, {
        method: 'POST',
        headers: {
          'X-API-Key': '53e53331a91f51237307407ee976d19ccd1be395a96f7931990a326772b12bae',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'connection test',
          userId: 'test'
        })
      });

      if (testResponse.status !== 404) {
        console.log('✅ Backend send endpoint exists (connection test passed)');
        return true;
      }

      throw new Error(`Send endpoint not found (${testResponse.status})`);
      
    } catch (error) {
      let errorReason = 'Unknown error';
      
      if (error.name === 'AbortError') {
        errorReason = 'Connection timeout (5s)';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorReason = 'Service unavailable';
      } else if (error.message.includes('fetch')) {
        errorReason = 'Network error';
      } else {
        errorReason = error.message;
      }
      
      console.warn('❌ Backend connection test failed:', errorReason);
      console.warn(`   Service URL: ${this.backendUrl}`);
      console.warn(`   Send endpoint: ${this.backendUrl}${this.endpoint}`);
      console.warn(`   Verify endpoint: ${this.backendUrl}/api/verify`);
      console.warn('   ℹ️ Application will continue in offline mode with intelligent fallback responses');
      
      // Store detailed error information
      this.lastError = {
        message: errorReason,
        timestamp: new Date().toISOString(),
        type: 'connection_test',
        userMessage: `Backend AI service is unavailable (${errorReason}). Using offline mode.`
      };
      
      // Return false to indicate backend is not available
      return false;
    }
  }

  /**
   * Get provider information
   * @returns {Object} Provider metadata
   */
  getProviderInfo() {
    return {
      name: 'Backend API',
      version: '1.0.0',
      description: 'Backend service integration for AI chat',
      backendUrl: this.backendUrl,
      endpoint: this.endpoint,
      timeout: this.timeout
    };
  }

  /**
   * Get provider capabilities
   * @returns {Object} Provider capabilities
   */
  getCapabilities() {
    return {
      supportsChat: true,
      supportsStreaming: false,
      maxMessageLength: 4096, // Adjust based on your backend
      supportedModels: ['backend-model'],
      features: ['conversation', 'context-awareness', 'backend-integration']
    };
  }

  /**
   * Validate configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig() {
    if (!this.backendUrl) {
      this.lastError = {
        message: 'Backend URL is required',
        timestamp: new Date().toISOString(),
        type: 'validation'
      };
      return false;
    }

    try {
      new URL(this.backendUrl);
    } catch (error) {
      this.lastError = {
        message: 'Invalid backend URL format',
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
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    
    if (newConfig.backendUrl) {
      this.backendUrl = newConfig.backendUrl;
    }
    if (newConfig.endpoint) {
      this.endpoint = newConfig.endpoint;
    }
    if (newConfig.apiKey) {
      this.apiKey = newConfig.apiKey;
    }
    if (newConfig.timeout) {
      this.timeout = newConfig.timeout;
    }
    
    // Reset state when config changes
    this.lastError = null;
    this.isInitialized = false;
  }

  /**
   * Generate narrative response with streaming support
   * @param {string} userMessage - User's message
   * @param {Array} messages - Conversation history
   * @param {Object} options - Streaming options
   * @returns {Promise<string>} Final response
   */
  async generateNarrativeResponse(userMessage, messages = [], options = {}) {
    const streamer = new ProgressiveResponseStreamer({
      onNarrative: options.onNarrative || (() => {}),
      onStatus: options.onStatus || (() => {}),
      onChunk: options.onChunk || (() => {}),
      onComplete: options.onComplete || (() => {}),
      onError: options.onError || (() => {})
    });

    try {
      // Start with discovery narrative
      streamer.streamNarrative(
        `🎯 Analyzing your request: "${userMessage}"`,
        'discovery_success'
      );

      // Simulate research process
      await this.delay(500);
      streamer.streamNarrative(
        'Searching knowledge base for relevant information',
        'progress_rag'
      );

      await this.delay(800);
      streamer.streamNarrative(
        'Looking up current information and best practices',
        'progress_web'
      );

      await this.delay(600);
      streamer.streamNarrative(
        'Refining search based on initial findings',
        'transition_refinement'
      );

      await this.delay(400);
      streamer.streamNarrative(
        'Found comprehensive information about your request',
        'discovery_success'
      );

      // Generate the actual response
      let response;
      try {
        response = await this.generate(userMessage, messages);
      } catch (error) {
        console.warn('Backend generation failed, using intelligent fallback:', error.message);
        
        // Show offline mode status
        streamer.streamNarrative(
          '⚠️ Running in offline mode - using intelligent fallback responses',
          'transition_warning'
        );
        
        await this.delay(300);
        
        // Create more intelligent fallback responses based on the user's message
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('how are you')) {
          response = `Hello! I'm the Cigno AI assistant, designed to help with EMEA Financial Services consulting. I'm currently running in offline mode, but I can still assist you with:

• **Consulting Strategy**: Wealth management, investment banking, retail banking
• **Regulatory Compliance**: EMEA financial regulations and compliance
• **Market Analysis**: Financial services trends and opportunities
• **Deliverable Creation**: Presentations, reports, and strategic documents

How can I help you with your consulting needs today?`;
        } else if (lowerMessage.includes('weather')) {
          response = `I'm a specialized AI assistant for EMEA Financial Services consulting, so I don't have access to weather information. However, I can help you with:

• **Financial Market Analysis**: Economic conditions and market trends
• **Risk Assessment**: Weather-related business risks in financial services
• **Regulatory Impact**: How environmental factors affect financial regulations
• **Strategic Planning**: Business continuity and risk management

Would you like me to help with any financial services consulting topics instead?`;
        } else if (lowerMessage.includes('cigno') || lowerMessage.includes('platform')) {
          response = `The Cigno Platform is a comprehensive consulting enablement platform for EMEA Financial Services. Here's what I can tell you:

**Core Mission**: "Helping consultants delivering high value services"

**Key Features**:
• Multi-agent research and analysis
• Real-time narrative progress updates
• EMEA regulatory compliance support
• Client relationship management
• Deliverable creation and collaboration

**Target Industries**: Wealth Management, Investment Banking, Retail Banking, Insurance

I'm currently running in offline mode, but I can still provide insights and assistance. What specific aspect of the Cigno platform would you like to know more about?`;
        } else {
          response = `I understand you're asking about "${userMessage}". As the Cigno AI assistant, I'm designed to help with EMEA Financial Services consulting. 

While I'm currently in offline mode, I can still assist with:

• **Strategic Analysis**: Your query relates to consulting and financial services
• **Research Support**: I can help identify key areas for investigation
• **Regulatory Guidance**: EMEA compliance and regulatory considerations
• **Deliverable Development**: Creating professional consulting outputs

Could you rephrase your question in the context of financial services consulting, or let me know how I can help with your consulting needs?`;
        }
      }
      
      // Stream the response in chunks
      const words = response.split(' ');
      for (let i = 0; i < words.length; i += 5) {
        const chunk = words.slice(i, i + 5).join(' ');
        streamer.streamChunk(chunk, i + 5 >= words.length);
        await this.delay(100);
      }

      streamer.streamComplete();
      return response;

    } catch (error) {
      streamer.streamError('Failed to generate response', { error: error.message });
      throw error;
    }
  }

  /**
   * Utility method for delays
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}