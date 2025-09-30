let cachedConfig = null;

// Simple environment variable validation
const validateEnv = () => {
  const config = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',
    ALLOW_EXTERNAL_AI: process.env.ALLOW_EXTERNAL_AI === 'true'
  };

  // Validate NODE_ENV
  if (!['development', 'test', 'production'].includes(config.NODE_ENV)) {
    throw new Error(`Invalid NODE_ENV: ${config.NODE_ENV}. Must be one of: development, test, production`);
  }

  // Validate LLM_PROVIDER
  if (!['openai'].includes(config.LLM_PROVIDER)) {
    throw new Error(`Invalid LLM_PROVIDER: ${config.LLM_PROVIDER}. Currently only 'openai' is supported`);
  }

  return config;
};

export function getConfig() {
  if (cachedConfig) return cachedConfig;

  try {
    cachedConfig = validateEnv();
    return cachedConfig;
  } catch (error) {
    throw new Error(`Config validation failed: ${error.message}`);
  }
}


