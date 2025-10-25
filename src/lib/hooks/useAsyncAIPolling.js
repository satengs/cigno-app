import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for async AI execution with polling
 * Handles the two-step process: start async execution → poll for completion
 */
export function useAsyncAIPolling() {
  const [status, setStatus] = useState('idle'); // idle, starting, polling, completed, failed
  const [progress, setProgress] = useState(0);
  const [narratives, setNarratives] = useState([]);
  const [executionId, setExecutionId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const pollIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Start async AI execution
   */
  const startAsyncExecution = useCallback(async (endpoint, payload) => {
    setStatus('starting');
    setProgress(0);
    setNarratives([]);
    setError(null);
    setResult(null);

    try {
      // Step 1: Start async execution
      console.log('🚀 Starting async AI execution...');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const startResult = await response.json();
      const newExecutionId = startResult.executionId;

      if (!newExecutionId) {
        throw new Error('No execution ID returned from async start');
      }

      setExecutionId(newExecutionId);
      setStatus('polling');
      
      // Add initial narrative
      setNarratives([{
        id: `start_${Date.now()}`,
        type: 'info',
        message: `Execution started with ID: ${newExecutionId}`,
        timestamp: new Date().toISOString()
      }]);

      console.log(`✅ Async execution started: ${newExecutionId}`);
      
      // Step 2: Start polling for status
      startPolling(newExecutionId);

    } catch (err) {
      console.error('❌ Failed to start async execution:', err);
      setStatus('failed');
      setError(err.message);
      
      // Add error narrative
      setNarratives(prev => [...prev, {
        id: `error_${Date.now()}`,
        type: 'error',
        message: `Failed to start execution: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  /**
   * Poll for execution status
   */
  const startPolling = useCallback((execId) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let pollCount = 0;
    const maxPolls = 120; // 10 minutes at 5-second intervals
    
    const poll = async () => {
      try {
        pollCount++;
        console.log(`📊 Polling attempt ${pollCount}/${maxPolls} for execution ${execId}`);

        const statusResponse = await fetch(`/api/ai/direct/status/${execId}`);
        
        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        const currentStatus = statusData.status;
        const currentProgress = statusData.progress || 0;
        const responseData = statusData.data;

        console.log(`📊 Status: ${currentStatus}, Progress: ${currentProgress}%`);

        // Update progress
        setProgress(currentProgress);

        // Add narratives from the response
        if (responseData?.narrative && Array.isArray(responseData.narrative)) {
          setNarratives(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newNarratives = responseData.narrative
              .map((content, index) => ({
                id: `narrative_${execId}_${index}`,
                type: 'progress',
                message: content,
                timestamp: new Date().toISOString()
              }))
              .filter(n => !existingIds.has(n.id));
            
            return [...prev, ...newNarratives];
          });
        }

        // Check for completion
        if (currentStatus === 'completed' || currentStatus === 'complete') {
          clearInterval(pollIntervalRef.current);
          setStatus('completed');
          setResult(responseData);
          
          // Add completion narrative
          setNarratives(prev => [...prev, {
            id: `complete_${Date.now()}`,
            type: 'success',
            message: 'Execution completed successfully',
            timestamp: new Date().toISOString()
          }]);

          console.log('✅ Async execution completed successfully');
          return;
        }

        // Check for failure
        if (currentStatus === 'failed' || currentStatus === 'error') {
          clearInterval(pollIntervalRef.current);
          setStatus('failed');
          const errorMsg = responseData?.error || statusData.error || 'Execution failed';
          setError(errorMsg);
          
          // Add error narrative
          setNarratives(prev => [...prev, {
            id: `error_${Date.now()}`,
            type: 'error',
            message: `Execution failed: ${errorMsg}`,
            timestamp: new Date().toISOString()
          }]);

          console.error('❌ Async execution failed:', errorMsg);
          return;
        }

        // Continue polling
        if (pollCount >= maxPolls) {
          clearInterval(pollIntervalRef.current);
          setStatus('failed');
          setError('Polling timeout after 10 minutes');
          
          setNarratives(prev => [...prev, {
            id: `timeout_${Date.now()}`,
            type: 'warning',
            message: 'Execution timeout - polling stopped after 10 minutes',
            timestamp: new Date().toISOString()
          }]);

          console.error('❌ Polling timeout after 10 minutes');
        }

      } catch (pollError) {
        console.error('❌ Polling error:', pollError);
        
        // Don't fail immediately on polling errors, just log and continue
        if (pollCount < maxPolls) {
          setNarratives(prev => [...prev, {
            id: `poll_error_${Date.now()}`,
            type: 'warning',
            message: `Polling attempt ${pollCount} failed: ${pollError.message}`,
            timestamp: new Date().toISOString()
          }]);
        } else {
          // Final failure after max attempts
          clearInterval(pollIntervalRef.current);
          setStatus('failed');
          setError(`Polling failed after ${maxPolls} attempts: ${pollError.message}`);
        }
      }
    };

    // Start polling every 5 seconds
    pollIntervalRef.current = setInterval(poll, 5000);
    
    // Poll immediately
    poll();
  }, []);

  /**
   * Cancel the current operation
   */
  const cancel = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setStatus('idle');
    setProgress(0);
    setExecutionId(null);
    setError(null);
    
    setNarratives(prev => [...prev, {
      id: `cancel_${Date.now()}`,
      type: 'warning',
      message: 'Operation cancelled by user',
      timestamp: new Date().toISOString()
    }]);
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    setStatus('idle');
    setProgress(0);
    setNarratives([]);
    setExecutionId(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    // State
    status, // 'idle', 'starting', 'polling', 'completed', 'failed'
    progress, // 0-100
    narratives, // Array of narrative objects with type, message, timestamp
    executionId,
    result,
    error,
    
    // Actions
    startAsyncExecution,
    cancel,
    reset,
    
    // Computed state
    isLoading: status === 'starting' || status === 'polling',
    isCompleted: status === 'completed',
    isFailed: status === 'failed',
    isIdle: status === 'idle'
  };
}

export default useAsyncAIPolling;