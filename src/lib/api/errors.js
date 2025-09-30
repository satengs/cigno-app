/**
 * Centralized API Error Handling
 * Provides standardized error responses and error codes
 */

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource Management
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Custom Business Logic
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_OPERATION: 'INVALID_OPERATION',
  RESOURCE_IN_USE: 'RESOURCE_IN_USE'
};

// HTTP status codes mapping
export const HTTP_STATUS_CODES = {
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.INVALID_TOKEN]: 401,
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.INVALID_INPUT]: 400,
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,
  [ERROR_CODES.INVALID_FORMAT]: 400,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.ALREADY_EXISTS]: 409,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.DATABASE_ERROR]: 500,
  [ERROR_CODES.CONNECTION_ERROR]: 500,
  [ERROR_CODES.TIMEOUT_ERROR]: 408,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 403,
  [ERROR_CODES.INVALID_OPERATION]: 400,
  [ERROR_CODES.RESOURCE_IN_USE]: 409
};

// Default error messages
export const DEFAULT_ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  [ERROR_CODES.FORBIDDEN]: 'Access denied',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid or expired token',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field missing',
  [ERROR_CODES.INVALID_FORMAT]: 'Invalid format',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.ALREADY_EXISTS]: 'Resource already exists',
  [ERROR_CODES.CONFLICT]: 'Resource conflict',
  [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
  [ERROR_CODES.CONNECTION_ERROR]: 'Database connection failed',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Operation timed out',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ERROR_CODES.INVALID_OPERATION]: 'Invalid operation',
  [ERROR_CODES.RESOURCE_IN_USE]: 'Resource is currently in use'
};

/**
 * Create a standardized error response
 */
export function createErrorResponse(code, message = null, details = null, statusCode = null) {
  const errorCode = code || ERROR_CODES.INTERNAL_ERROR;
  const errorMessage = message || DEFAULT_ERROR_MESSAGES[errorCode];
  const httpStatus = statusCode || HTTP_STATUS_CODES[errorCode] || 500;
  
  return {
    ok: false,
    error: {
      code: errorCode,
      message: errorMessage,
      details: details,
      timestamp: new Date().toISOString()
    },
    statusCode: httpStatus
  };
}

/**
 * Create a validation error response
 */
export function createValidationError(validationErrors, field = null) {
  const details = {
    field: field,
    errors: Array.isArray(validationErrors) ? validationErrors : [validationErrors]
  };
  
  return createErrorResponse(
    ERROR_CODES.VALIDATION_ERROR,
    'Validation failed',
    details,
    400
  );
}

/**
 * Create a not found error response
 */
export function createNotFoundError(resource = 'Resource', id = null) {
  const details = {
    resource: resource,
    id: id
  };
  
  return createErrorResponse(
    ERROR_CODES.NOT_FOUND,
    `${resource} not found`,
    details,
    404
  );
}

/**
 * Create a database error response
 */
export function createDatabaseError(operation = 'Database operation', originalError = null) {
  const details = {
    operation: operation,
    originalError: originalError ? originalError.message : null,
    errorType: originalError ? originalError.constructor.name : null
  };
  
  return createErrorResponse(
    ERROR_CODES.DATABASE_ERROR,
    `${operation} failed`,
    details,
    500
  );
}

/**
 * Create a timeout error response
 */
export function createTimeoutError(operation = 'Operation', timeout = null) {
  const details = {
    operation: operation,
    timeout: timeout
  };
  
  return createErrorResponse(
    ERROR_CODES.TIMEOUT_ERROR,
    `${operation} timed out`,
    details,
    408
  );
}

/**
 * Create a conflict error response
 */
export function createConflictError(resource = 'Resource', reason = null) {
  const details = {
    resource: resource,
    reason: reason
  };
  
  return createErrorResponse(
    ERROR_CODES.CONFLICT,
    `${resource} conflict`,
    details,
    409
  );
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedError(reason = null) {
  const details = {
    reason: reason
  };
  
  return createErrorResponse(
    ERROR_CODES.UNAUTHORIZED,
    'Authentication required',
    details,
    401
  );
}

/**
 * Create a forbidden error response
 */
export function createForbiddenError(resource = 'Resource', reason = null) {
  const details = {
    resource: resource,
    reason: reason
  };
  
  return createErrorResponse(
    ERROR_CODES.FORBIDDEN,
    'Access denied',
    details,
    403
  );
}

/**
 * Create a rate limit error response
 */
export function createRateLimitError(limit = null, retryAfter = null) {
  const details = {
    limit: limit,
    retryAfter: retryAfter
  };
  
  return createErrorResponse(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded',
    details,
    429
  );
}

/**
 * Handle common database errors and convert to appropriate API errors
 */
export function handleDatabaseError(error, operation = 'Database operation') {
  if (error.name === 'ValidationError') {
    let validationErrors = [];
    
    // Handle Mongoose validation errors
    if (error.errors) {
      validationErrors = Object.values(error.errors).map(err => err.message);
    }
    // Handle custom validation errors with details
    else if (error.details && Array.isArray(error.details)) {
      validationErrors = error.details.map(detail => detail.message);
    }
    // Handle single validation error message
    else if (error.message) {
      validationErrors = [error.message];
    }
    
    if (validationErrors.length > 0) {
      return createValidationError(validationErrors);
    }
  }
  
  if (error.name === 'CastError') {
    return createErrorResponse(
      ERROR_CODES.INVALID_INPUT,
      `Invalid ${error.path}: ${error.value}`,
      {
        field: error.path,
        value: error.value,
        expectedType: error.kind
      },
      400
    );
  }
  
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return createConflictError(
      'Resource',
      `${field} already exists`
    );
  }
  
  if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
    return createTimeoutError(operation, '10 seconds');
  }
  
  // Default database error
  return createDatabaseError(operation, error);
}

/**
 * Create a success response
 */
export function createSuccessResponse(data = null, message = 'Success') {
  return {
    ok: true,
    data: data,
    message: message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check if a response is an error response
 */
export function isErrorResponse(response) {
  return response && response.ok === false && response.error;
}

/**
 * Extract error information from a response
 */
export function extractErrorInfo(response) {
  if (!isErrorResponse(response)) {
    return null;
  }
  
  return {
    code: response.error.code,
    message: response.error.message,
    details: response.error.details,
    statusCode: response.statusCode
  };
}

/**
 * Log error for debugging
 */
export function logError(error, context = {}) {
  console.error('API Error:', {
    code: error.code || 'UNKNOWN',
    message: error.message,
    details: error.details,
    context: context,
    timestamp: new Date().toISOString()
  });
}

export default {
  ERROR_CODES,
  HTTP_STATUS_CODES,
  DEFAULT_ERROR_MESSAGES,
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createDatabaseError,
  createTimeoutError,
  createConflictError,
  createUnauthorizedError,
  createForbiddenError,
  createRateLimitError,
  handleDatabaseError,
  createSuccessResponse,
  isErrorResponse,
  extractErrorInfo,
  logError
};

