export function getRequiredAiApiKey() {
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('AI API key is not configured. Set AI_API_KEY or OPENAI_API_KEY in the environment.');
  }
  return key;
}

export default getRequiredAiApiKey;
