/**
 * Backend Service Configuration
 * Configure connection to your backend service on port 3000
 */
export const BackendConfig = {
  // Backend service URL - Updated to use deployed API
  baseUrl: process.env.BACKEND_URL || 'https://ai.vave.ch',
  
  // API endpoint for chat requests (updated to match deployed backend)
  chatEndpoint: process.env.BACKEND_CHAT_ENDPOINT || '/api/chat/send-streaming',
  
  // Health check endpoint (optional)
  healthEndpoint: process.env.BACKEND_HEALTH_ENDPOINT || '/health',
  
  // Authentication - set to null for internal calls, or provide your backend's API key
  apiKey: process.env.BACKEND_API_KEY || 'd4abe60bb87d3f6156285c0e0341ccb7965b387638cab06ed4f7d8566e9b3111', // Test API key
  
  // Refresh token for authentication
  refreshToken: process.env.REFRESH_TOKEN || null,
  
  // Request configuration
  timeout: parseInt(process.env.BACKEND_TIMEOUT) || 30000, // 30 seconds
  retries: parseInt(process.env.BACKEND_RETRIES) || 2,
  
  // Request format options - adjust these based on your backend's expected format
  requestFormat: {
    // What field name does your backend expect for the user message?
    messageField: 'message', // or 'prompt', 'input', 'query', etc.
    
    // Does your backend expect conversation history?
    includeHistory: true,
    historyField: 'conversation', // or 'messages', 'history', 'context', etc.
    
    // Additional fields your backend might expect
    additionalFields: {
      // source: 'cigno-platform',
      // version: '1.0',
      // timestamp: true, // Will add current timestamp
    }
  },
  
  // Response format options - adjust these based on your backend's response format
  responseFormat: {
    // What field contains the AI response in your backend's response?
    // The BackendProvider will try these in order:
    responseFields: [
      'response',     // { response: "AI response here" }
      'message',      // { message: "AI response here" }
      'content',      // { content: "AI response here" }
      'result',       // { result: "AI response here" }
      'data.response', // { data: { response: "AI response here" } }
      'choices[0].message.content' // OpenAI format
    ]
  },
  
  // Error handling
  errorHandling: {
    logErrors: true,
    fallbackToMock: true, // Fall back to mock responses if backend fails
    maxConsecutiveErrors: 3 // Switch to fallback after this many errors
  }
};

/**
 * Get backend configuration for different environments
 */
export function getBackendConfig(environment = 'development') {
  const baseConfig = { ...BackendConfig };
  
  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        baseUrl: process.env.BACKEND_URL || 'http://your-backend-service:3000',
        timeout: 15000, // Shorter timeout in production
        retries: 1
      };
      
    case 'staging':
      return {
        ...baseConfig,
        baseUrl: process.env.BACKEND_URL || 'http://staging-backend:3000',
        timeout: 20000
      };
      
    case 'development':
    default:
      return {
        ...baseConfig,
        timeout: 30000, // Longer timeout for development
        retries: 2,
        errorHandling: {
          ...baseConfig.errorHandling,
          logErrors: true
        }
      };
  }
}

export default BackendConfig;