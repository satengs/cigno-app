/**
 * AI Request and Narrative Logger
 * Logs external AI requests and narratives for monitoring and debugging
 */

class AILogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  /**
   * Log an outgoing AI request
   * @param {Object} requestData - Request details
   */
  logAIRequest(requestData) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: 'ai_request',
      level: 'info',
      data: {
        url: requestData.url,
        method: requestData.method || 'POST',
        headers: this.sanitizeHeaders(requestData.headers),
        payload: this.sanitizePayload(requestData.payload),
        agentId: requestData.agentId,
        requestType: requestData.requestType,
        projectId: requestData.projectId,
        userId: requestData.userId
      }
    };

    this.addLog(logEntry);
    this.consoleLog('🤖 AI Request', logEntry);
    return logEntry.id;
  }

  /**
   * Log an AI response
   * @param {string} requestId - ID from the original request
   * @param {Object} responseData - Response details
   */
  logAIResponse(requestId, responseData) {
    const logEntry = {
      id: this.generateId(),
      requestId,
      timestamp: new Date().toISOString(),
      type: 'ai_response',
      level: responseData.success ? 'info' : 'error',
      data: {
        status: responseData.status,
        success: responseData.success,
        duration: responseData.duration,
        responseSize: responseData.responseSize,
        error: responseData.error,
        agentId: responseData.agentId,
        source: responseData.source
      }
    };

    this.addLog(logEntry);
    this.consoleLog(responseData.success ? '✅ AI Response' : '❌ AI Error', logEntry);
    return logEntry.id;
  }

  /**
   * Log a narrative event
   * @param {Object} narrativeData - Narrative details
   */
  logNarrative(narrativeData) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: 'narrative',
      level: 'info',
      data: {
        content: narrativeData.content,
        narrativeType: narrativeData.type,
        phase: narrativeData.phase,
        projectId: narrativeData.projectId,
        userId: narrativeData.userId,
        source: narrativeData.source || 'ai_backend'
      }
    };

    this.addLog(logEntry);
    this.consoleLog('📖 Narrative', logEntry);
    return logEntry.id;
  }

  /**
   * Log AI streaming chunk
   * @param {Object} chunkData - Streaming chunk details
   */
  logStreamingChunk(chunkData) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: 'streaming_chunk',
      level: 'debug',
      data: {
        content: chunkData.content,
        chunkSize: chunkData.content?.length || 0,
        isComplete: chunkData.isComplete,
        requestId: chunkData.requestId,
        projectId: chunkData.projectId
      }
    };

    this.addLog(logEntry);
    // Only log to console in debug mode to avoid spam
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog('📝 Streaming', logEntry);
    }
    return logEntry.id;
  }

  /**
   * Add log entry to the logs array
   * @param {Object} logEntry - Log entry to add
   */
  addLog(logEntry) {
    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Console log with formatting
   * @param {string} prefix - Log prefix
   * @param {Object} logEntry - Log entry
   */
  consoleLog(prefix, logEntry) {
    console.log(`${prefix} [${logEntry.timestamp}] ${logEntry.id}`);
    
    if (logEntry.type === 'ai_request') {
      console.log(`   URL: ${logEntry.data.url}`);
      console.log(`   Type: ${logEntry.data.requestType || 'unknown'}`);
      console.log(`   Project: ${logEntry.data.projectId || 'unknown'}`);
      if (logEntry.data.agentId) {
        console.log(`   Agent: ${logEntry.data.agentId}`);
      }
    } else if (logEntry.type === 'ai_response') {
      console.log(`   Status: ${logEntry.data.status}`);
      console.log(`   Duration: ${logEntry.data.duration}ms`);
      if (logEntry.data.error) {
        console.log(`   Error: ${logEntry.data.error}`);
      }
    } else if (logEntry.type === 'narrative') {
      console.log(`   Content: ${logEntry.data.content?.slice(0, 100)}...`);
      console.log(`   Type: ${logEntry.data.narrativeType || 'unknown'}`);
    } else if (logEntry.type === 'streaming_chunk') {
      console.log(`   Chunk: ${logEntry.data.chunkSize} chars`);
      console.log(`   Complete: ${logEntry.data.isComplete}`);
    }
  }

  /**
   * Get logs filtered by criteria
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered logs
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }

    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters.projectId) {
      filteredLogs = filteredLogs.filter(log => log.data.projectId === filters.projectId);
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= sinceDate);
    }

    if (filters.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Get AI request statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const requests = this.logs.filter(log => log.type === 'ai_request');
    const responses = this.logs.filter(log => log.type === 'ai_response');
    const narratives = this.logs.filter(log => log.type === 'narrative');
    const errors = this.logs.filter(log => log.level === 'error');

    const successfulResponses = responses.filter(log => log.data.success);
    const failedResponses = responses.filter(log => !log.data.success);

    const durations = responses
      .filter(log => log.data.duration)
      .map(log => log.data.duration);

    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;

    return {
      totalRequests: requests.length,
      totalResponses: responses.length,
      successfulResponses: successfulResponses.length,
      failedResponses: failedResponses.length,
      successRate: responses.length > 0 ? (successfulResponses.length / responses.length) * 100 : 0,
      totalNarratives: narratives.length,
      totalErrors: errors.length,
      averageResponseTime: Math.round(avgDuration),
      timeRange: {
        oldest: this.logs.length > 0 ? this.logs[0].timestamp : null,
        newest: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null
      }
    };
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    console.log('🧹 AI logs cleared');
  }

  /**
   * Sanitize headers to remove sensitive information
   * @param {Object} headers - Request headers
   * @returns {Object} Sanitized headers
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    
    // Remove or mask sensitive headers (case-insensitive)
    const sensitiveHeaders = ['x-api-key', 'authorization', 'cookie', 'set-cookie'];
    
    Object.keys(sanitized).forEach(headerKey => {
      const lowerKey = headerKey.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        sanitized[headerKey] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize payload to remove sensitive information
   * @param {Object} payload - Request payload
   * @returns {Object} Sanitized payload
   */
  sanitizePayload(payload) {
    if (!payload) return {};
    
    try {
      const sanitized = JSON.parse(JSON.stringify(payload));
      
      // Remove or truncate large fields
      if (sanitized.message && sanitized.message.length > 500) {
        sanitized.message = sanitized.message.slice(0, 500) + '... [TRUNCATED]';
      }
      
      // Remove sensitive fields
      const sensitiveFields = ['apiKey', 'password', 'token', 'secret'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });

      return sanitized;
    } catch (error) {
      return { error: 'Failed to sanitize payload' };
    }
  }

  /**
   * Generate unique ID for log entries
   * @returns {string} Unique ID
   */
  generateId() {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
const aiLogger = new AILogger();

export default aiLogger;