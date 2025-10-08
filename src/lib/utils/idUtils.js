/**
 * Utility functions for consistent ObjectId handling across the application
 * Ensures MongoDB _id fields are properly maintained and converted
 */

/**
 * Normalizes an object to ensure both _id and id fields are present and consistent
 * @param {Object} obj - Object that may have _id, id, or both
 * @returns {Object} Object with both _id and id fields properly set
 */
export function normalizeId(obj) {
  if (!obj) return obj;
  
  // Get the primary ID value (prefer _id if available)
  const primaryId = obj._id || obj.id;
  
  if (!primaryId) return obj;
  
  return {
    ...obj,
    _id: primaryId,
    id: typeof primaryId === 'object' ? primaryId.toString() : primaryId
  };
}

/**
 * Normalizes an array of objects to ensure consistent ID handling
 * @param {Array} array - Array of objects that may have inconsistent ID fields
 * @returns {Array} Array with all objects having both _id and id fields
 */
export function normalizeIds(array) {
  if (!Array.isArray(array)) return array;
  return array.map(normalizeId);
}

/**
 * Gets a string representation of an object's ID (for API calls, comparisons, etc.)
 * @param {Object|String} objOrId - Object with _id/id field or direct ID value
 * @returns {String} String representation of the ID
 */
export function getIdString(objOrId) {
  if (!objOrId) return null;
  
  if (typeof objOrId === 'string') return objOrId;
  
  const id = objOrId._id || objOrId.id;
  return typeof id === 'object' ? id.toString() : id;
}

/**
 * Gets the ObjectId value for database operations
 * @param {Object|String} objOrId - Object with _id/id field or direct ID value
 * @returns {ObjectId|String} The raw ObjectId or string for database queries
 */
export function getObjectId(objOrId) {
  if (!objOrId) return null;
  
  if (typeof objOrId === 'string') return objOrId;
  
  return objOrId._id || objOrId.id;
}

/**
 * Compares two IDs for equality, handling both string and ObjectId formats
 * @param {*} id1 - First ID to compare
 * @param {*} id2 - Second ID to compare
 * @returns {Boolean} True if IDs match
 */
export function idsEqual(id1, id2) {
  if (!id1 || !id2) return false;
  
  const str1 = getIdString(id1);
  const str2 = getIdString(id2);
  
  return str1 === str2;
}

/**
 * Prepares data for API responses - ensures both _id and id fields for frontend compatibility
 * @param {Object} data - Database object or API response data
 * @returns {Object} Data formatted for frontend consumption
 */
export function formatForAPI(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(formatForAPI);
  }
  
  if (typeof data === 'object' && data.toObject) {
    // Mongoose document - convert to plain object first
    return normalizeId(data.toObject());
  }
  
  return normalizeId(data);
}

/**
 * Validates that an ID is in valid MongoDB ObjectId format
 * @param {String} id - ID string to validate
 * @returns {Boolean} True if valid ObjectId format
 */
export function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}