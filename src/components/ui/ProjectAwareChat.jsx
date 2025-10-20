'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Loader2, MessageCircle, FolderOpen, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ProjectAwareChat = ({ 
  isOpen, 
  onClose, 
  currentProject = null,
  userId = null 
}) => {
  // Generate or use provided userId
  const [sessionUserId] = useState(() => userId || uuidv4());
  const [currentContext, setCurrentContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Switch project context when currentProject changes
  useEffect(() => {
    if (currentProject && isOpen) {
      switchProjectContext(currentProject);
    }
  }, [currentProject, isOpen]);

  // Switch to project context
  const switchProjectContext = async (project) => {
    if (!project || !project.id) {
      console.warn('Invalid project data for context switch');
      return;
    }

    setIsInitializing(true);
    
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
        setCurrentContext({
          contextId: result.data.contextId,
          projectId: result.data.projectId,
          projectName: result.data.projectData.name,
          projectData: result.data.projectData
        });
        setMessages(result.data.messages || []);
      } else {
        throw new Error(result.error || 'Failed to switch context');
      }

    } catch (error) {
      console.error('Failed to switch project context:', error);
      setMessages([{
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while switching to this project. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsInitializing(false);
    }
  };

  // Send message in current project context
  const sendMessage = async (message) => {
    if (!currentContext || !message.trim() || isLoading) return;

    setIsLoading(true);
    
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
      } else {
        throw new Error(result.error || 'Failed to send message');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading && !isInitializing) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  // Clear current project conversation
  const clearConversation = async () => {
    if (!currentContext) return;

    try {
      const response = await fetch(`/api/chat/project?userId=${sessionUserId}&projectId=${currentContext.projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages([]);
        // Re-initialize the project context
        await switchProjectContext({ 
          id: currentContext.projectId, 
          name: currentContext.projectName,
          ...currentContext.projectData 
        });
      }
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Bot className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">Project AI Assistant</h3>
            {currentContext ? (
              <div className="text-xs text-gray-500 truncate">
                <FolderOpen className="inline w-3 h-3 mr-1" />
                <span className="font-medium">{currentContext.projectName}</span>
              </div>
            ) : currentProject ? (
              <div className="text-xs text-gray-500">
                <span className="text-orange-500">Switching to: {currentProject.name || currentProject.title}</span>
              </div>
            ) : (
              <div className="text-xs text-gray-500">No project selected</div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {currentContext && (
            <button
              onClick={clearConversation}
              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isInitializing && (
          <div className="text-center text-gray-500 py-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Loading project context...</span>
            </div>
          </div>
        )}

        {!isInitializing && !currentContext && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Select a project to start chatting</p>
            <p className="text-xs mt-1">Chat context is maintained per project</p>
          </div>
        )}

        {!isInitializing && currentContext && messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Start a conversation about</p>
            <p className="font-medium text-gray-700">{currentContext.projectName}</p>
            <p className="text-xs mt-1">Your chat history is saved for this project</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="text-xs opacity-60 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-gray-600" />
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg">
                <div className="flex items-center space-x-1">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Thinking about your project...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              currentContext 
                ? `Ask about ${currentContext.projectName}...`
                : "Select a project first..."
            }
            disabled={isLoading || isInitializing || !currentContext}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={isLoading || isInitializing || !currentContext || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectAwareChat;