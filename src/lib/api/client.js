/**
 * Debounced API Client with Race Condition Handling
 * Provides debounced API calls and prevents race conditions
 */

import { createErrorResponse, createSuccessResponse } from './errors.js';

class DebouncedAPIClient {
  constructor() {
    this.pendingRequests = new Map(); // requestId -> { promise, controller }
    this.debounceTimers = new Map(); // endpoint -> timer
    this.requestCounter = 0;
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Cancel pending request
   */
  cancelRequest(requestId) {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      request.controller.abort();
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Cancel all pending requests for an endpoint
   */
  cancelAllRequests(endpoint) {
    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (request.endpoint === endpoint) {
        this.cancelRequest(requestId);
      }
    }
  }

  /**
   * Make a debounced API call
   */
  async debouncedCall(endpoint, options = {}, delay = 600) {
    // Cancel existing timer for this endpoint
    if (this.debounceTimers.has(endpoint)) {
      clearTimeout(this.debounceTimers.get(endpoint));
    }

    // Cancel any pending requests for this endpoint
    this.cancelAllRequests(endpoint);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const result = await this.makeRequest(endpoint, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.debounceTimers.set(endpoint, timer);
    });
  }

  /**
   * Make a regular API call
   */
  async makeRequest(endpoint, options = {}) {
    const requestId = this.generateRequestId();
    const controller = new AbortController();

    // Store request for potential cancellation
    this.pendingRequests.set(requestId, {
      promise: null,
      controller,
      endpoint,
      timestamp: Date.now()
    });

    try {
      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal
      });

      // Remove from pending requests
      this.pendingRequests.delete(requestId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Remove from pending requests
      this.pendingRequests.delete(requestId);

      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }

      throw error;
    }
  }

  /**
   * Make a PATCH request with debouncing
   */
  async patch(endpoint, data, delay = 600) {
    return this.debouncedCall(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }, delay);
  }

  /**
   * Make a GET request
   */
  async get(endpoint) {
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint) {
    return this.makeRequest(endpoint, {
      method: 'DELETE'
    });
  }

  /**
   * Get pending requests count
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }

  /**
   * Get pending requests for debugging
   */
  getPendingRequests() {
    return Array.from(this.pendingRequests.entries()).map(([id, request]) => ({
      id,
      endpoint: request.endpoint,
      timestamp: request.timestamp,
      age: Date.now() - request.timestamp
    }));
  }

  /**
   * Clear all pending requests and timers
   */
  clearAll() {
    // Cancel all pending requests
    for (const [requestId] of this.pendingRequests.entries()) {
      this.cancelRequest(requestId);
    }

    // Clear all timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}

// Create singleton instance
const apiClient = new DebouncedAPIClient();

export default apiClient;
export { DebouncedAPIClient };

