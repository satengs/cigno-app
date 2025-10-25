/**
 * Direct External AI Service
 * Handles direct communication with external AI APIs without intermediate layers
 */

import aiLogger from '../logging/aiLogger.js';

class ExternalAIService {
  constructor() {
    this.baseUrl = process.env.AI_API_BASE_URL || 'https://ai.vave.ch';
    this.apiKey = process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Execute custom agent directly - Synchronous execution
   * @param {string} agentId - The agent ID to execute
   * @param {Object} payload - Request payload
   * @returns {Promise<Object>} Agent response
   */
  async executeAgent(agentId, payload) {
    const url = `${this.baseUrl}/api/custom-agents/${agentId}/execute`;
    
    // Log the AI request
    const requestId = aiLogger.logAIRequest({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '[REDACTED]'
      },
      payload,
      agentId,
      requestType: 'execute_agent',
      projectId: payload.context?.projectId || payload.projectId,
      userId: payload.userId || 'unknown'
    });

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Agent execution failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      // Log successful response
      aiLogger.logAIResponse(requestId, {
        status: response.status,
        success: true,
        duration: Date.now() - startTime,
        responseSize: JSON.stringify(result).length,
        agentId,
        source: 'external_ai_direct'
      });

      return result;

    } catch (error) {
      // Log failed response
      aiLogger.logAIResponse(requestId, {
        status: error.status || 500,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        agentId,
        source: 'external_ai_direct'
      });

      throw error;
    }
  }

  /**
   * Execute custom agent asynchronously - Returns execution ID for polling
   * @param {string} agentId - The agent ID to execute
   * @param {Object} payload - Request payload
   * @returns {Promise<Object>} Execution response with executionId
   */
  async executeAgentAsync(agentId, payload) {
    const url = `${this.baseUrl}/api/custom-agents/${agentId}/execute-async`;
    
    // Log the AI request
    const requestId = aiLogger.logAIRequest({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '[REDACTED]'
      },
      payload,
      agentId,
      requestType: 'execute_agent_async',
      projectId: payload.context?.projectId || payload.projectId,
      userId: payload.userId || 'unknown'
    });

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Async agent execution failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      // Log successful response
      aiLogger.logAIResponse(requestId, {
        status: response.status,
        success: true,
        duration: Date.now() - startTime,
        responseSize: JSON.stringify(result).length,
        agentId,
        source: 'external_ai_async'
      });

      return result;

    } catch (error) {
      // Log failed response
      aiLogger.logAIResponse(requestId, {
        status: error.status || 500,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        agentId,
        source: 'external_ai_async'
      });

      throw error;
    }
  }

  /**
   * Poll for execution status using the correct endpoint
   * @param {string} executionId - The execution ID to check
   * @returns {Promise<Object>} Execution status
   */
  async getExecutionStatus(executionId) {
    const url = `${this.baseUrl}/api/custom-agents/executions/${executionId}`;
    
    // Log the status check request
    const requestId = aiLogger.logAIRequest({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '[REDACTED]'
      },
      payload: null,
      requestType: 'status_check',
      executionId,
      userId: 'system'
    });

    const startTime = Date.now();

    try {
      console.log(`🌐 EXTERNAL API REQUEST: GET ${url}`);
      console.log(`📋 Request headers:`, {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey ? '[PRESENT]' : '[MISSING]'
      });
      console.log(`📋 Request timeout: 10000ms`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout for status checks
      });

      console.log(`📊 EXTERNAL API RESPONSE: HTTP___________ ${response.status} ${response.statusText}`);
      console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        
        console.error(`❌ EXTERNAL API ERROR: ${response.status} - ${errorText}`);
        
        // Log failed status check
        aiLogger.logAIResponse(requestId, {
          status: response.status,
          success: false,
          duration: Date.now() - startTime,
          error: `Status check failed: ${errorText}`,
          source: 'external_ai_status'
        });

        throw new Error(`Status check failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      const normalizeExecutionStatusPayload = (payload) => {
        if (!payload || typeof payload !== 'object') {
          return payload;
        }

        const base = { ...payload };
        const nested = base.data && typeof base.data === 'object' ? { ...base.data } : null;

        if (nested) {
          const normalized = {
            ...base,
            ...nested,
            data: nested
          };

          const resolvedProgress =
            Number.isFinite(nested.progress)
              ? nested.progress
              : Number.isFinite(base.progress)
                ? base.progress
                : Number.parseFloat(nested.progress);

          if (Number.isFinite(resolvedProgress)) {
            normalized.progress = resolvedProgress;
            if (resolvedProgress >= 100 && (!normalized.status || normalized.status === 'running')) {
              normalized.status = 'completed';
            }
          }

          normalized.status = normalized.status || base.status || nested.state;

          if (!normalized.result) {
            if (nested.result) {
              normalized.result = nested.result;
            } else if (nested.response !== undefined) {
              normalized.result = { response: nested.response };
            }
          } else if (normalized.result && normalized.result.response === undefined && nested.response !== undefined) {
            normalized.result = { ...normalized.result, response: nested.response };
          }

          if (!normalized.result && base.result) {
            normalized.result = base.result;
          }

          if (!normalized.result && base.response !== undefined) {
            normalized.result = { response: base.response };
          }

          return normalized;
        }

        if (Number.isFinite(base.progress) && base.progress >= 100 && (!base.status || base.status === 'running')) {
          base.status = 'completed';
        }

        if (!base.result && base.response !== undefined) {
          base.result = { response: base.response };
        }

        return base;
      };

      const normalizedResult = normalizeExecutionStatusPayload(result);

      console.log(`✅ EXTERNAL API SUCCESS: Response received`);
      console.log(`📋 Response size: ${JSON.stringify(result).length} bytes`);
      console.log(`📋 Response data:`, JSON.stringify(result, null, 2));

      // Log successful status check
      aiLogger.logAIResponse(requestId, {
        status: response.status,
        success: true,
        duration: Date.now() - startTime,
        responseSize: JSON.stringify(result).length,
        source: 'external_ai_status'
      });

      return normalizedResult;

    } catch (error) {
      // Log failed status check if not already logged
      if (!error.message.includes('Status check failed')) {
        aiLogger.logAIResponse(requestId, {
          status: 500,
          success: false,
          duration: Date.now() - startTime,
          error: error.message,
          source: 'external_ai_status'
        });
      }

      throw new Error(`Failed to check execution status: ${error.message}`);
    }
  }

  /**
   * Poll for execution completion with exponential backoff
   * Uses the correct polling endpoint: GET /api/custom-agents/executions/{execution_id}
   * @param {string} executionId - The execution ID to poll
   * @param {Object} options - Polling options
   * @returns {Promise<Object>} Final execution result
   */
  async pollForCompletion(executionId, options = {}) {
    const {
      maxAttempts = 60, // Increased for longer tasks
      initialDelay = 2000, // Start with 2 seconds
      maxDelay = 8000, // Max 15 seconds between polls
      backoffFactor = 1.3
    } = options;

    let delay = initialDelay;
    let attempts = 0;
    let lastStatus = 'pending';

    console.log(`🔍 Starting polling for execution: ${executionId}`);

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await this.getExecutionStatus(executionId);
        
        // Handle different response formats from the external API
        const currentStatus = statusResponse.status || statusResponse.state || 'unknown';
        const progress = statusResponse.progress || statusResponse.completion || 0;
        const result = statusResponse.result || statusResponse.data || statusResponse;

        console.log(`📊 Poll ${attempts + 1}/${maxAttempts}: ${currentStatus} (${progress}%)`);

        // Check for completion
        if (currentStatus === 'complete' || currentStatus === 'completed' || currentStatus === 'success') {
          console.log('✅ Execution completed successfully');
          
          // Log completion narrative if available
          if (result.response || result.content) {
            aiLogger.logNarrative({
              content: `Execution ${executionId} completed successfully`,
              type: 'completion_success',
              phase: 'completion',
              executionId,
              userId: 'system',
              source: 'external_ai_polling'
            });
          }
          
          return result;
        } 
        
        // Check for failure states
        if (currentStatus === 'failed' || currentStatus === 'error' || currentStatus === 'failure') {
          const errorMessage = statusResponse.error || statusResponse.message || 'Execution failed';
          console.error(`❌ Execution failed: ${errorMessage}`);
          aiLogger.logNarrative({
            content: `Execution ${executionId} failed: ${errorMessage}`,
            type: 'completion_error',
            phase: 'completion',
            executionId,
            userId: 'system',
            source: 'external_ai_polling'
          });
          
          throw new Error(`Execution failed: ${errorMessage}`);
        }

        // Log progress updates for significant changes
        if (currentStatus !== lastStatus) {
          aiLogger.logNarrative({
            content: `Execution ${executionId} status changed to: ${currentStatus} (${progress}%)`,
            type: 'progress_update',
            phase: 'execution',
            executionId,
            userId: 'system',
            source: 'external_ai_polling'
          });
          lastStatus = currentStatus;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase delay with exponential backoff
        delay = Math.min(delay * backoffFactor, maxDelay);
        attempts++;

      } catch (error) {
        console.warn(`⚠️ Poll attempt ${attempts + 1} failed:`, error.message);
        
        // If it's the last attempt, throw the error
        if (attempts === maxAttempts - 1) {
          console.error(`❌ Polling failed after ${maxAttempts} attempts`);
          throw new Error(`Polling timeout after ${maxAttempts} attempts: ${error.message}`);
        }
        
        // For non-final attempts, continue with backoff
        attempts++;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    console.error(`❌ Execution polling timeout after ${maxAttempts} attempts`);
    throw new Error(`Execution polling timeout after ${maxAttempts} attempts. Execution may still be running.`);
  }

  /**
   * Execute agent with automatic async handling for long-running tasks
   * Step 1: POST /api/custom-agents/{agent_id}/execute-async (returns executionId)
   * Step 2: Poll GET /api/custom-agents/executions/{execution_id} until complete
   * @param {string} agentId - The agent ID to execute
   * @param {Object} payload - Request payload
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Agent response
   */
  async executeAgentSmart(agentId, payload, options = {}) {
    const { useAsync = false, pollOptions = {} } = options;

    if (useAsync) {
      console.log('🔄 Starting async execution with proper polling...');
      
      // Step 1: Start async execution
      const asyncResult = await this.executeAgentAsync(agentId, payload);
      
      // Extract execution ID from response
      const executionId = asyncResult.executionId || asyncResult.id || asyncResult.execution_id;
      
      if (executionId) {
        console.log(`🔍 Polling for execution ${executionId} using /api/custom-agents/executions/{id}...`);
        
        // Step 2: Poll for completion
        const finalResult = await this.pollForCompletion(executionId, pollOptions);
        return finalResult;
      } else {
        console.warn('⚠️ No execution ID returned from async start, returning initial result');
        return asyncResult;
      }
      
    } else {
      console.log('⚡ Starting sync execution...');
      return await this.executeAgent(agentId, payload);
    }
  }

  /**
   * Get agent information
   * @param {string} agentId - The agent ID
   * @returns {Promise<Object>} Agent details
   */
  async getAgentInfo(agentId) {
    const url = `${this.baseUrl}/api/custom-agents/${agentId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get agent info (${response.status}): ${errorText}`);
      }

      return await response.json();

    } catch (error) {
      throw new Error(`Failed to get agent information: ${error.message}`);
    }
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.timeout) this.timeout = config.timeout;
  }
}

// Create singleton instance
const externalAIService = new ExternalAIService();

export default externalAIService;
