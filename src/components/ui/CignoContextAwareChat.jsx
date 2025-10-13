import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Loader2, MessageCircle } from 'lucide-react';
import CignoChatContextManager from '../../utils/CignoChatContextManager';

const CignoContextAwareChat = ({ 
  isOpen, 
  onClose, 
  selectedItem, 
  contentType 
}) => {
  const [contextManager] = useState(() => new CignoChatContextManager());
  const [currentContext, setCurrentContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update context when selectedItem changes
  useEffect(() => {
    if (selectedItem && contentType && isOpen) {
      const projectId = selectedItem.projectId || selectedItem.id || 'default';
      const projectData = {
        name: selectedItem.projectName || selectedItem.title || 'Current Project'
      };
      
      handleContextSwitch(projectId, projectData, selectedItem, contentType);
    }
  }, [selectedItem, contentType, isOpen]);

  // Handle context switching
  const handleContextSwitch = async (projectId, projectData, item, itemType) => {
    try {
      const context = await contextManager.switchToProject(projectId, projectData);
      contextManager.updateCurrentItem(itemType, item);
      
      setCurrentContext(context);
      
      // Load chat history for this project
      const history = await contextManager.getChatHistory(context.chatId);
      setMessages(history);
      
      // Send context to chat (only if there are no existing messages)
      if (history.length === 0) {
        await contextManager.sendContextToChat(context, item, itemType);
        // Reload messages after context is sent
        const updatedHistory = await contextManager.getChatHistory(context.chatId);
        setMessages(updatedHistory);
      }
    } catch (error) {
      console.error('Failed to switch context:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while switching context. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  // Send user message
  const sendMessage = async (message) => {
    if (!currentContext || !message.trim()) return;

    setIsLoading(true);
    
    try {
      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to database
      await contextManager.saveMessage(currentContext.chatId, userMessage);

      // Send to CIGNO API
      const { requestId } = await contextManager.sendMessage(
        message,
        currentContext.chatId
      );

      // Poll for response
      const result = await contextManager.pollForResponse(requestId);
      
      // Create assistant message
      const assistantMessage = {
        role: 'assistant',
        content: result.response || 'Response received',
        html: result.html,
        followUpQuestions: result.followUpQuestions || [],
        footnotes: result.footnotes || {},
        timestamp: new Date().toISOString()
      };
      
      // Add assistant response to UI
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to database
      await contextManager.saveMessage(currentContext.chatId, assistantMessage);

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle follow-up questions
  const handleFollowUpQuestion = (question) => {
    setInputMessage(question);
    sendMessage(question);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            {currentContext && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Project:</span> {currentContext.projectName}
                {currentContext.currentItem && (
                  <span> | <span className="font-medium">{currentContext.currentItem.type}:</span> {currentContext.currentItem.title}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Start a conversation about this project</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                  {msg.html ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: msg.html }} 
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
              
              {/* Follow-up questions */}
              {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Suggested questions:</p>
                  {msg.followUpQuestions.map((question, qIndex) => (
                    <button
                      key={qIndex}
                      onClick={() => handleFollowUpQuestion(question)}
                      className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Footnotes */}
              {msg.footnotes && Object.keys(msg.footnotes).length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  {Object.entries(msg.footnotes).map(([key, footnote]) => (
                    <div key={key} className="text-gray-600">
                      <sup className="text-blue-600 font-medium">{key}</sup> {footnote.text}
                      {footnote.source && (
                        <span className="text-gray-500 italic">
                          - {footnote.source}
                          {footnote.page && `, page ${footnote.page}`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                  <span className="text-sm text-gray-500">Thinking...</span>
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
            placeholder="Ask about this project..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CignoContextAwareChat;
