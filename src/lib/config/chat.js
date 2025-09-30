/**
 * Chat Configuration for External Connections
 */
export const ChatConfig = {
  // Server configuration
  server: {
    httpPort: process.env.PORT || 3001,
    wsPort: process.env.WS_PORT || 8080,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
  },

  // API configuration
  api: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000, // 1 hour
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100
    },
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 4000,
    maxThreads: parseInt(process.env.MAX_THREADS_PER_USER) || 10
  },

  // WebSocket configuration
  websocket: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000, // 30 seconds
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 1000,
    idleTimeout: parseInt(process.env.WS_IDLE_TIMEOUT) || 300000 // 5 minutes
  },

  // AI configuration
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7
  },

  // Security configuration
  security: {
    apiKeyRotationDays: parseInt(process.env.API_KEY_ROTATION_DAYS) || 90,
    enableCors: process.env.ENABLE_CORS !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    enableLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false'
  },

  // Available API keys (in production, store in secure database)
  apiKeys: {
    production: 'd8888197b6edf249bfa0c8dd7ec1af7176d273529802c39ecdd79eb1324065c4',
    development: 'd4abe60bb87d3f6156285c0e0341ccb7965b387638cab06ed4f7d8566e9b3111',
    consultant: 'ca4f82e78deb36a4d3ebdbf9d22de6db72e2eb9705097a4e0074a3742c746b29',
    manager: 'b0d67edcba8e1554253cc96a86b3556b38be1585b14ff8b084468b7646d0180b'
  }
};

/**
 * Get configuration for external apps
 */
export function getExternalConfig() {
  return {
    baseUrl: ChatConfig.server.baseUrl,
    wsUrl: ChatConfig.server.wsUrl,
    apiKeys: ChatConfig.apiKeys,
    maxMessageLength: ChatConfig.api.maxMessageLength,
    endpoints: {
      chat: `${ChatConfig.server.baseUrl}/api/chat`,
      websocket: `${ChatConfig.server.wsUrl}/ws`,
      health: `${ChatConfig.server.baseUrl}/api/health`
    }
  };
}

/**
 * Get connection instructions for external apps
 */
export function getConnectionInstructions() {
  return {
    websocket: {
      url: `${ChatConfig.server.wsUrl}/ws?apiKey=YOUR_API_KEY&userId=YOUR_USER_ID`,
      example: `${ChatConfig.server.wsUrl}/ws?apiKey=${ChatConfig.apiKeys.development}&userId=test_user`
    },
    http: {
      url: `${ChatConfig.server.baseUrl}/api/chat`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'YOUR_API_KEY'
      },
      body: {
        message: 'Your message here',
        threadId: 'optional_thread_id',
        userId: 'optional_user_id'
      }
    }
  };
}

export default ChatConfig;