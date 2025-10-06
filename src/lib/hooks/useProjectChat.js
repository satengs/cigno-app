import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook for managing project-specific chat contexts
 * @param {string} userId - User identifier (optional, will generate if not provided)
 * @returns {Object} Chat state and methods
 */
export const useProjectChat = (userId = null) => {
  const [sessionUserId] = useState(() => userId || uuidv4());
  const [currentProject, setCurrentProject] = useState(null);
  const [currentContext, setCurrentContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);

  // Switch to a different project context
  const switchToProject = useCallback(async (project) => {
    if (!project || !project.id) {
      console.warn('Invalid project data for context switch');
      return false;
    }

    // Don't switch if already on the same project
    if (currentProject?.id === project.id) {
      return true;
    }

    setIsInitializing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'switch',
          userId: sessionUserId,
          projectId: project.id,
          projectData: {
            id: project.id,
            name: project.name || project.title,
            description: project.description,
            status: project.status,
            start_date: project.start_date || project.metadata?.start_date,
            end_date: project.end_date || project.metadata?.end_date,
            budget_amount: project.budget_amount || project.metadata?.budget_amount,
            budget_currency: project.budget_currency || project.metadata?.budget_currency,
            budget_type: project.budget_type || project.metadata?.budget_type,
            client_name: project.client_name || project.metadata?.client_name,
            client_industry: project.client_industry || project.metadata?.client_industry,
            internal_owner: project.internal_owner || project.metadata?.internal_owner,
            deliverables: project.deliverables || project.metadata?.deliverables || []
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to switch context: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.ok) {
        setCurrentProject(project);
        setCurrentContext({
          contextId: result.data.contextId,
          projectId: result.data.projectId,
          projectName: result.data.projectData.name,
          projectData: result.data.projectData
        });
        setMessages(result.data.messages || []);
        return true;
      } else {
        throw new Error(result.error || 'Failed to switch context');
      }

    } catch (err) {
      console.error('Failed to switch project context:', err);
      setError(err.message);
      setMessages([{
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while switching to this project. Please try again.',
        timestamp: new Date().toISOString()
      }]);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [sessionUserId, currentProject]);

  // Send a message in the current project context
  const sendMessage = useCallback(async (message) => {
    if (!currentContext || !message.trim() || isLoading) {
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message to UI immediately
      const userMessage = {
        id: 'user-' + Date.now(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to project chat API
      const response = await fetch('/api/chat/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          userId: sessionUserId,
          projectId: currentContext.projectId,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.ok) {
        // Update messages with the complete conversation
        setMessages(result.data.messages || []);
        return true;
      } else {
        throw new Error(result.error || 'Failed to send message');
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date().toISOString()
      }]);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionUserId, currentContext, isLoading]);

  // Clear current project conversation
  const clearConversation = useCallback(async () => {
    if (!currentContext) return false;

    try {
      const response = await fetch(`/api/chat/project?userId=${sessionUserId}&projectId=${currentContext.projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages([]);
        // Re-initialize the project context
        await switchToProject(currentProject);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to clear conversation:', err);
      setError(err.message);
      return false;
    }
  }, [sessionUserId, currentContext, currentProject, switchToProject]);

  // Get all project contexts for the user
  const getUserContexts = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/project?userId=${sessionUserId}&action=contexts`);
      
      if (!response.ok) {
        throw new Error(`Failed to get contexts: ${response.status}`);
      }

      const result = await response.json();
      return result.ok ? result.data.contexts : [];
    } catch (err) {
      console.error('Failed to get user contexts:', err);
      setError(err.message);
      return [];
    }
  }, [sessionUserId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    sessionUserId,
    currentProject,
    currentContext,
    messages,
    isLoading,
    isInitializing,
    error,

    // Actions
    switchToProject,
    sendMessage,
    clearConversation,
    getUserContexts,
    clearError,

    // Computed
    isReady: !isInitializing && currentContext,
    hasProject: !!currentProject,
    contextId: currentContext?.contextId,
    projectName: currentContext?.projectName
  };
};