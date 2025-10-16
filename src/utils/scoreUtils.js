/**
 * Normalizes score values to a consistent 0-10 scale
 * Handles values that might come in different scales (0-100, 0-10, etc.)
 */
export const normalizeScoreValue = (value) => {
  if (value === null || value === undefined) return null;

  let numeric = value;
  if (typeof numeric === 'string') {
    const match = numeric.match(/-?\d+(?:\.\d+)?/);
    numeric = match ? Number(match[0]) : Number(numeric);
  }

  if (!Number.isFinite(numeric)) {
    return null;
  }

  // Assume values > 10 are on a 0-100 scale and need conversion
  // Values <= 10 are already on the correct 0-10 scale
  const scaled = numeric > 10 ? numeric / 10 : numeric;
  return Number(Math.max(0, Math.min(10, scaled)).toFixed(1));
};

/**
 * Formats a score for display
 */
export const formatScore = (score) => {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return 'N/A';
  }
  return `${score.toFixed(1)} / 10`;
};

/**
 * Checks if a score meets the minimum threshold for storyline generation
 */
export const isScoreAboveThreshold = (score, threshold = 7.5) => {
  return Number.isFinite(score) && score >= threshold;
};