'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Plus, 
  Eye, 
  Send, 
  Bot, 
  User, 
  Loader2,
  MessageCircle,
  Folder,
  Globe,
  X,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { authService } from '../../lib/auth/AuthService';

export default function RightSection({ isModalOpen = false, selectedItem = null }) {
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    internalResources: true,
    externalResources: true,
    relatedInsights: true, // Default to expanded
    aiAssistant: false
  });

  // State for resource groups
  const [expandedGroups, setExpandedGroups] = useState({
    internal: {},
    external: {}
  });

  // State for source management
  const [selectedSources, setSelectedSources] = useState({
    internal: new Set(),
    external: new Set()
  });
  const [sourceRelevance, setSourceRelevance] = useState({});
  const [isUpdatingRelevance, setIsUpdatingRelevance] = useState(false);


  // AI Assistant state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your Cigno AI assistant, specialized in EMEA Financial Services consulting. I can help you with:\n\n• **Strategic Analysis**: Wealth management, investment banking, retail banking\n• **Regulatory Compliance**: EMEA financial regulations and compliance\n• **Market Research**: Financial services trends and opportunities\n• **Deliverable Creation**: Presentations, reports, and strategic documents\n\nHow can I assist you with your consulting needs today?',
      timestamp: Date.now() - 60000
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef(null);

  // Resize state
  const [rightSectionWidth, setRightSectionWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null);
  const [internalResourcesHeight, setInternalResourcesHeight] = useState(200);
  const [externalResourcesHeight, setExternalResourcesHeight] = useState(150);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);

  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Force close other sections when AI assistant opens
  useEffect(() => {
    if (expandedSections.aiAssistant) {
      setExpandedSections(prev => ({
        ...prev,
        relatedInsights: false
      }));
    }
  }, [expandedSections.aiAssistant]);


  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!isClient) return '--:--';
    return new Date(timestamp).toLocaleTimeString();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => {
      const newState = { ...prev };
      
      // If opening AI assistant, automatically close related insights
      if (sectionName === 'aiAssistant' && !prev[sectionName]) {
        newState.relatedInsights = false;
      }
      
      // Toggle the requested section
      newState[sectionName] = !prev[sectionName];
      
      return newState;
    });
  };

  const toggleGroup = (type, groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [groupId]: !prev[type][groupId]
      }
    }));
  };

  // Source management functions
  const toggleSourceSelection = (type, sourceId) => {
    setSelectedSources(prev => ({
      ...prev,
      [type]: new Set(prev[type].has(sourceId) 
        ? [...prev[type]].filter(id => id !== sourceId)
        : [...prev[type], sourceId]
      )
    }));
  };

  const updateSourceRelevance = async (sourceId, newRelevance) => {
    setIsUpdatingRelevance(true);
    try {
      // Simulate API call to update relevance
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSourceRelevance(prev => ({
        ...prev,
        [sourceId]: newRelevance
      }));
    } catch (error) {
      console.error('Error updating source relevance:', error);
    } finally {
      setIsUpdatingRelevance(false);
    }
  };

  const addSource = (type) => {
    // Create a new source with default values
    const newSource = {
      id: Date.now(),
      name: `New ${type} Source`,
      type: type === 'internal' ? 'PDF' : 'Website',
      description: `Description for new ${type} source`,
      relevance: 50,
      source: 'User Added',
      lastModified: new Date().toISOString().split('T')[0],
      lastAccessed: new Date().toISOString().split('T')[0]
    };

    if (type === 'internal') {
      // Add to internal resources
      console.log('Added internal source:', newSource);
      // In a real app, this would update the state or make an API call
    } else {
      // Add to external resources
      console.log('Added external source:', newSource);
      // In a real app, this would update the state or make an API call
    }
  };

  const removeSource = (type, sourceId) => {
    if (type === 'internal') {
      console.log('Removed internal source:', sourceId);
      // In a real app, this would update the state or make an API call
    } else {
      console.log('Removed external source:', sourceId);
      // In a real app, this would update the state or make an API call
    }
  };


  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInputValue = inputValue; // Save the input value before clearing
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('🚀 Sending message to ai.vave.ch:', currentInputValue);
      
      // First try the external ai.vave.ch API
      let response;
      try {
        response = await fetch('https://ai.vave.ch/api/chat/send-streaming', {
          method: 'POST',
          headers: {
            'X-API-Key': '53e53331a91f51237307407ee976d19ccd1be395a96f7931990a326772b12bae',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: currentInputValue,
            userId: 'cigno-dashboard-user',
            chatId: `chat_${Date.now()}`
          })
        });

        console.log('📡 External API response status:', response.status);

        if (!response.ok) {
          throw new Error(`External API error: ${response.status}`);
        }

        // Handle streaming response from external API
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  console.log('📄 Stream data:', data);
                  
                  // Handle different response types from the API
                  if (data.type === 'narrative') {
                    // Add narrative message
                    const narrativeMessage = {
                      id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      role: 'narrative',
                      content: data.content,
                      timestamp: data.timestamp || new Date().toISOString()
                    };
                    setMessages(prev => [...prev, narrativeMessage]);
                  } else if (data.role === 'assistant' && data.content) {
                    // Handle streaming assistant response
                    fullResponse = data.content;
                    
                    // Update the last message with streaming content
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.type === 'assistant') {
                        lastMessage.content = fullResponse;
                      } else {
                        // Add new streaming message
                        newMessages.push({
                          id: data.id || `assistant_${Date.now()}`,
                          type: 'assistant',
                          content: fullResponse,
                          timestamp: data.timestamp || new Date().toISOString()
                        });
                      }
                      return newMessages;
                    });
                  } else if (data.response) {
                    // Handle response according to documentation
                    fullResponse += data.response;
                    
                    // Update the last message with streaming content
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.type === 'assistant') {
                        lastMessage.content = fullResponse;
                      } else {
                        // Add new streaming message
                        newMessages.push({
                          id: Date.now() + 1,
                          type: 'assistant',
                          content: fullResponse,
                          timestamp: Date.now()
                        });
                      }
                      return newMessages;
                    });
                  } else if (data.error) {
                    throw new Error(data.error || 'Stream error occurred');
                  }
                } catch (e) {
                  console.warn('Failed to parse stream data:', e);
                }
              }
            }
          }
        }

        // Final response handling
        if (fullResponse) {
          console.log('✅ External AI response completed:', fullResponse);
        } else {
          // Fallback if no response received
          const aiResponse = {
            id: Date.now() + 1,
            type: 'assistant',
            content: 'I received your message but couldn\'t process the response format.',
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiResponse]);
        }
        
        setIsLoading(false);
        return;
      } catch (externalError) {
        console.warn('⚠️ External API failed, trying local fallback:', externalError.message);
      }

      // Fallback to local API
      console.log('🔄 Trying local API fallback...');
      const localResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify({
          message: currentInputValue,
          userId: 'cigno-dashboard-user'
        })
      });

      console.log('📡 Local API response status:', localResponse.status);

      if (!localResponse.ok) {
        const errorText = await localResponse.text();
        console.error('❌ Local API error:', localResponse.status, errorText);
        throw new Error(`Local API error! status: ${localResponse.status} - ${errorText}`);
      }

      const data = await localResponse.json();
      console.log('📄 Local API response data:', data);
      
      if (data.ok && data.data.messages) {
        // Get the last message (should be the AI response)
        const lastMessage = data.data.messages[data.data.messages.length - 1];
        
        if (lastMessage && lastMessage.role === 'assistant') {
          const aiResponse = {
            id: Date.now() + 1,
            type: 'assistant',
            content: lastMessage.content,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiResponse]);
          console.log('✅ Local AI response added:', lastMessage.content);
        } else {
          throw new Error('No assistant message found in local response');
        }
      } else {
        throw new Error(data.error || 'Failed to get response from local chat API');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('💥 Error sending message:', error);
      
      // Final fallback - provide a helpful response
      const fallbackResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I understand you're asking about "${currentInputValue}". As your Cigno AI assistant, I'm designed to help with EMEA Financial Services consulting. 

While I'm currently running in offline mode, I can still assist you with:

• **Strategic Analysis**: Your query relates to consulting and financial services
• **Research Support**: I can help identify key areas for investigation  
• **Regulatory Guidance**: EMEA compliance and regulatory considerations
• **Deliverable Development**: Creating professional consulting outputs

Could you rephrase your question in the context of financial services consulting, or let me know how I can help with your consulting needs?`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, fallbackResponse]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea based on content
  const handleTextareaChange = (e) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Resize handlers
  const startResize = (type) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType(type);
    setResizeStartY(e.clientY);
    
    if (type === 'internal-height') {
      setResizeStartHeight(internalResourcesHeight);
    } else if (type === 'external-height') {
      setResizeStartHeight(externalResourcesHeight);
    }
  };

  const handleResize = (e) => {
    if (!isResizing || !resizeType) return;
    
    if (resizeType === 'width') {
      const newWidth = window.innerWidth - e.clientX;
      setRightSectionWidth(Math.max(200, Math.min(600, newWidth)));
    } else if (resizeType === 'internal-height') {
      const deltaY = e.clientY - resizeStartY;
      const newHeight = resizeStartHeight + deltaY;
      setInternalResourcesHeight(Math.max(100, Math.min(400, newHeight)));
    } else if (resizeType === 'external-height') {
      const deltaY = e.clientY - resizeStartY;
      const newHeight = resizeStartHeight + deltaY;
      setExternalResourcesHeight(Math.max(100, Math.min(300, newHeight)));
    }
  };

  const stopResize = () => {
    setIsResizing(false);
    setResizeType(null);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing, resizeType]);


  // Function to get dynamic insights based on selected content
  const getRelatedInsights = (selectedItem) => {
    if (!selectedItem) {
      return [
        {
          id: 1,
          title: "Select a content section to see related insights",
          source: "System",
          confidence: 0,
          maxConfidence: 10,
          type: "placeholder"
        }
      ];
    }

    // CBDC Strategy Presentation insights
    if (selectedItem.title?.includes('CBDC') || selectedItem.title?.includes('Strategy')) {
      return [
        {
          id: 1,
          title: "CBDCs will impact 80% of central banks by 2025",
          source: "BIS Annual Report",
          confidence: 9,
          maxConfidence: 10,
          type: "statistical"
        },
        {
          id: 2,
          title: "Financial institutions need 12-18 month preparation window",
          source: "McKinsey Analysis",
          confidence: 8,
          maxConfidence: 10,
          type: "timeline"
        },
        {
          id: 3,
          title: "Retail CBDC models show 32% higher adoption rates",
          source: "ECB Research Paper",
          confidence: 7,
          maxConfidence: 10,
          type: "adoption"
        },
        {
          id: 4,
          title: "Digital currency infrastructure requires $2.4T investment by 2030",
          source: "PWC Global Survey",
          confidence: 8.5,
          maxConfidence: 10,
          type: "investment"
        }
      ];
    }

    // Digital Transformation insights
    if (selectedItem.title?.includes('Digital') || selectedItem.title?.includes('Transformation')) {
      return [
        {
          id: 1,
          title: "Digital transformation increases operational efficiency by 35%",
          source: "Deloitte Digital Report",
          confidence: 8.5,
          maxConfidence: 10,
          type: "efficiency"
        },
        {
          id: 2,
          title: "AI adoption in banking will reach 85% by 2026",
          source: "Accenture Banking Report",
          confidence: 9,
          maxConfidence: 10,
          type: "adoption"
        },
        {
          id: 3,
          title: "Cloud migration reduces IT costs by 40% on average",
          source: "Gartner Research",
          confidence: 8,
          maxConfidence: 10,
          type: "cost"
        }
      ];
    }

    // Risk Management insights
    if (selectedItem.title?.includes('Risk') || selectedItem.title?.includes('Compliance')) {
      return [
        {
          id: 1,
          title: "Regulatory fines increased 45% in 2024",
          source: "Financial Times",
          confidence: 9,
          maxConfidence: 10,
          type: "regulatory"
        },
        {
          id: 2,
          title: "Cybersecurity incidents cost banks $4.2M on average",
          source: "IBM Security Report",
          confidence: 8.5,
          maxConfidence: 10,
          type: "security"
        },
        {
          id: 3,
          title: "ESG compliance reduces risk premiums by 15%",
          source: "MSCI Research",
          confidence: 7.5,
          maxConfidence: 10,
          type: "esg"
        }
      ];
    }

    // Client Engagement insights
    if (selectedItem.title?.includes('Client') || selectedItem.title?.includes('Engagement')) {
      return [
        {
          id: 1,
          title: "Personalized experiences increase client satisfaction by 60%",
          source: "McKinsey Client Survey",
          confidence: 8.5,
          maxConfidence: 10,
          type: "satisfaction"
        },
        {
          id: 2,
          title: "Omnichannel clients generate 3x more revenue",
          source: "Deloitte Digital Banking",
          confidence: 9,
          maxConfidence: 10,
          type: "revenue"
        },
        {
          id: 3,
          title: "Mobile-first clients have 40% higher retention rates",
          source: "Forrester Research",
          confidence: 8,
          maxConfidence: 10,
          type: "retention"
        }
      ];
    }

    // Default insights for other content
    return [
      {
        id: 1,
        title: "Data-driven decisions improve outcomes by 25%",
        source: "Harvard Business Review",
        confidence: 8,
        maxConfidence: 10,
        type: "analytics"
      },
      {
        id: 2,
          title: "Real-time insights increase response time by 50%",
          source: "Industry Report",
          confidence: 7.5,
          maxConfidence: 10,
          type: "efficiency"
        },
        {
          id: 3,
          title: "AI-powered tools reduce manual work by 70%",
          source: "McKinsey Global Institute",
          confidence: 9,
          maxConfidence: 10,
          type: "automation"
        }
      ];
  };

      const relatedInsights = getRelatedInsights(selectedItem);

  // Sample resource data with relevance scores
  const internalResourcesGroups = [
    {
      id: 'strategy-docs',
      name: 'Strategy Documents',
      items: [
        {
          id: 1,
          name: 'CBDC Implementation Strategy.pdf', 
          type: 'PDF', 
          size: '2.4 MB', 
          lastModified: '2024-01-15',
          relevance: 95,
          description: 'Comprehensive strategy document for CBDC implementation',
          source: 'Internal Report'
        },
        {
          id: 2,
          name: 'Digital Transformation Roadmap.docx', 
          type: 'DOCX', 
          size: '1.8 MB', 
          lastModified: '2024-01-12',
          relevance: 88,
          description: 'Strategic roadmap for digital transformation initiatives',
          source: 'Strategy Document'
        }
      ]
    },
    {
      id: 'research-papers',
      name: 'Research Papers',
      items: [
        {
          id: 3,
          name: 'Central Bank Digital Currencies.pdf', 
          type: 'PDF', 
          size: '3.2 MB', 
          lastModified: '2024-01-10',
          relevance: 92,
          description: 'Research on global CBDC trends and implications',
          source: 'Market Research'
        },
        {
          id: 4,
          name: 'Financial Innovation Trends.docx', 
          type: 'DOCX', 
          size: '2.1 MB', 
          lastModified: '2024-01-08',
          relevance: 78,
          description: 'Analysis of emerging financial technology trends',
          source: 'Industry Analysis'
        }
      ]
    }
  ];

  const externalResourcesGroups = [
    {
      id: 'regulatory',
      name: 'Regulatory Resources',
      items: [
        {
          id: 1, 
          name: 'BIS CBDC Guidelines', 
          url: 'https://bis.org', 
          type: 'Website', 
          lastAccessed: '2024-01-14',
          relevance: 95,
          description: 'Bank for International Settlements annual report',
          source: 'auto-retrieved'
        },
        { 
          id: 2, 
          name: 'ECB Digital Euro Report', 
          url: 'https://ecb.europa.eu', 
          type: 'Report', 
          lastAccessed: '2024-01-13',
          relevance: 89,
          description: 'European Central Bank digital euro initiative',
          source: 'auto-retrieved'
        },
        { 
          id: 3, 
          name: 'McKinsey Digital Banking', 
          url: 'https://mckinsey.com', 
          type: 'Report', 
          lastAccessed: '2024-01-12',
          relevance: 72,
          description: 'Global consulting perspective on digital currencies',
          source: 'auto-retrieved'
        }
      ]
    }
  ];

  return (
    <div 
      className="flex flex-col h-screen relative overflow-hidden border-l"
      style={{ 
        width: `${rightSectionWidth}px`,
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
        zIndex: 20
      }}
    >
      {/* Left Border Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-40 flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          borderLeft: '1px solid var(--border-primary)'
        }}
        onMouseDown={startResize('width')}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'var(--bg-secondary)';
          e.target.style.borderLeft = '2px solid var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.borderLeft = '1px solid var(--border-primary)';
        }}
        title="Drag to resize panel width"
      >
        <div className="h-8 w-0.5 rounded" style={{ backgroundColor: 'var(--text-secondary)' }} />
      </div>


      {/* Internal Resources Section */}
      <div className="flex flex-col">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer transition-colors"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => toggleSection('internalResources')}
        >
          <div className="flex items-center space-x-2">
            <Folder className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            {expandedSections.internalResources ? (
              <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            )}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Internal Resources</span>
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              {internalResourcesGroups.reduce((total, group) => total + group.items.length, 0)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-2 py-1 text-xs rounded transition-colors cursor-pointer flex items-center space-x-1"
              style={{ 
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
                  onClick={(e) => {
                    e.stopPropagation();
                    addSource('internal');
                  }}
              title="Add internal resource"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>
        </div>
        
        {expandedSections.internalResources && (
          <div 
            className="flex flex-col"
            style={{ height: `${internalResourcesHeight}px` }}
          >
            <div 
              className="px-4 pb-4 space-y-3 overflow-y-auto flex-1"
            >
            {internalResourcesGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleGroup('internal', group.id)}
                >
                  <div className="flex items-center space-x-2">
                    {expandedGroups.internal[group.id] ? (
                      <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                    ) : (
                      <ChevronUp className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                    )}
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {group.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {group.items.length}
                    </span>
                  </div>
                </div>
                
                {expandedGroups.internal[group.id] && (
                  <div className="ml-4 space-y-2">
                        {group.items.map((item) => {
                          const isSelected = selectedSources.internal.has(item.id);
                          const currentRelevance = sourceRelevance[item.id] || item.relevance;
                          
                          return (
                      <div 
                        key={item.id} 
                              className={`rounded-lg p-3 transition-colors cursor-pointer ${
                                isSelected ? 'ring-2 ring-blue-500' : ''
                              }`}
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                      >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSourceSelection('internal', item.id)}
                                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                          <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                      {item.name}
                                    </h4>
                                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                                      {item.description}
                                    </p>
                                    <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                      <span>{item.type}</span>
                                      <span>•</span>
                                      <span>{item.size}</span>
                                      <span>•</span>
                                      <span>{item.lastModified}</span>
                                      <span>•</span>
                                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ 
                                  backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)'
                                      }}>
                                        {item.source}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center space-x-2">
                                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Relevance: {currentRelevance}%
                                      </span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className="h-1.5 rounded-full transition-all duration-300"
                                          style={{ 
                                            width: `${currentRelevance}%`,
                                            backgroundColor: currentRelevance >= 90 ? '#10b981' : 
                                                           currentRelevance >= 70 ? '#f59e0b' : '#ef4444'
                                          }}
                                        />
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newRelevance = Math.min(100, currentRelevance + 5);
                                          updateSourceRelevance(item.id, newRelevance);
                                        }}
                                        disabled={isUpdatingRelevance}
                                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                      >
                                        +5%
                                      </button>
                            </div>
                          </div>
                        </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <button 
                                    className="p-1 rounded transition-colors"
                                    style={{ 
                                      backgroundColor: 'transparent',
                                      color: 'var(--text-secondary)'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('View item', item.id);
                                    }}
                                    title="View"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button 
                                    className="p-1 rounded transition-colors"
                                    style={{ 
                                      backgroundColor: 'transparent',
                                      color: 'var(--text-secondary)'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSource('internal', item.id);
                                    }}
                                    title="Remove source"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                      </div>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                )}
              </div>
            ))}
          </div>

            {/* Resize handle for internal resources */}
          <div
              className="w-full h-3 cursor-row-resize flex items-center justify-center"
            style={{ 
              backgroundColor: 'transparent',
                borderTop: '1px solid var(--border-primary)'
              }}
              onMouseDown={startResize('internal-height')}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-secondary)';
                e.target.style.borderTop = '2px solid var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderTop = '1px solid var(--border-primary)';
              }}
              title="Drag to resize internal resources height"
            >
              <div className="w-8 h-0.5 rounded" style={{ backgroundColor: 'var(--text-secondary)' }} />
            </div>
          </div>
        )}
      </div>

      {/* External Resources Section */}
      <div className="flex flex-col">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer transition-colors"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => toggleSection('externalResources')}
        >
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            {expandedSections.externalResources ? (
              <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            )}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>External Resources</span>
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              {externalResourcesGroups.reduce((total, group) => total + group.items.length, 0)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-2 py-1 text-xs rounded transition-colors cursor-pointer flex items-center space-x-1"
              style={{ 
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
                  onClick={(e) => {
                    e.stopPropagation();
                    addSource('external');
                  }}
              title="Add external resource"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>
        </div>
        
        {expandedSections.externalResources && (
          <div 
            className="flex flex-col"
            style={{ height: `${externalResourcesHeight}px` }}
          >
            <div 
              className="px-4 pb-4 space-y-3 overflow-y-auto flex-1"
            >
            {externalResourcesGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleGroup('external', group.id)}
                >
                  <div className="flex items-center space-x-2">
                    {expandedGroups.external[group.id] ? (
                      <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                    ) : (
                      <ChevronUp className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                    )}
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {group.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {group.items.length}
                    </span>
                  </div>
                </div>
                
                    {expandedGroups.external[group.id] && (
                      <div className="ml-4 space-y-2">
                        {group.items.map((item) => {
                          const isSelected = selectedSources.external.has(item.id);
                          const currentRelevance = sourceRelevance[item.id] || item.relevance;
                          
                          return (
                            <div 
                              key={item.id} 
                              className={`rounded-lg p-3 transition-colors cursor-pointer ${
                                isSelected ? 'ring-2 ring-blue-500' : ''
                              }`}
                              style={{ backgroundColor: 'var(--bg-secondary)' }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSourceSelection('external', item.id)}
                                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                      {item.name}
                                    </h4>
                                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                                      {item.description}
                                    </p>
                                    <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                      <span>{item.type}</span>
                                      <span>•</span>
                                      <span>{item.lastAccessed}</span>
                                      <span>•</span>
                                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ 
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)'
                                      }}>
                                        {item.source}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center space-x-2">
                                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Relevance: {currentRelevance}%
                                      </span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className="h-1.5 rounded-full transition-all duration-300"
                                          style={{ 
                                            width: `${currentRelevance}%`,
                                            backgroundColor: currentRelevance >= 90 ? '#10b981' : 
                                                           currentRelevance >= 70 ? '#f59e0b' : '#ef4444'
                                          }}
                                        />
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newRelevance = Math.min(100, currentRelevance + 5);
                                          updateSourceRelevance(item.id, newRelevance);
                                        }}
                                        disabled={isUpdatingRelevance}
                                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                      >
                                        +5%
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <button 
                                    className="p-1 rounded transition-colors"
                                    style={{ 
                                      backgroundColor: 'transparent',
                                      color: 'var(--text-secondary)'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(item.url, '_blank');
                                    }}
                                    title="Open link"
                                  >
                                    <Globe className="h-3 w-3" />
                                  </button>
                                  <button 
                                    className="p-1 rounded transition-colors"
                                    style={{ 
                                      backgroundColor: 'transparent',
                                      color: 'var(--text-secondary)'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSource('external', item.id);
                                    }}
                                    title="Remove source"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
              </div>
            ))}
            </div>
            
            {/* Resize handle for external resources */}
            <div
              className="w-full h-3 cursor-row-resize flex items-center justify-center"
              style={{
                backgroundColor: 'transparent',
                borderTop: '1px solid var(--border-primary)'
              }}
              onMouseDown={startResize('external-height')}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-secondary)';
                e.target.style.borderTop = '2px solid var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderTop = '1px solid var(--border-primary)';
              }}
              title="Drag to resize external resources height"
            >
              <div className="w-8 h-0.5 rounded" style={{ backgroundColor: 'var(--text-secondary)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Related Insights Section */}
      <div className="flex flex-col">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer transition-colors"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => toggleSection('relatedInsights')}
        >
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            {expandedSections.relatedInsights ? (
              <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            )}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Related Insights</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-2 py-1 text-xs rounded transition-colors cursor-pointer flex items-center space-x-1"
              style={{ 
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
              onClick={(e) => {
                e.stopPropagation();
                // Add a new insight
                const newInsight = {
                  id: Date.now(),
                  title: "New Insight",
                  source: "User Added",
                  confidence: 5,
                  maxConfidence: 10,
                  type: "custom"
                };
                console.log('Added insight:', newInsight);
                // In a real app, this would update the state or make an API call
              }}
              title="Add insight"
            >
              <Plus className="h-3 w-3" />
              <span>Add Insights</span>
            </button>
          </div>
        </div>
        
        {expandedSections.relatedInsights && (
          <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1">
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Supporting research for this section
                </div>
                
            {relatedInsights.map((insight) => (
                      <div 
                key={insight.id} 
                        className="rounded-lg p-3 transition-colors cursor-pointer"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                      >
                <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      {insight.title}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {insight.source}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button 
                      className="p-1 rounded transition-colors"
            style={{ 
              backgroundColor: 'transparent',
                        color: 'var(--text-secondary)'
            }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Removed insight:', insight.id);
                // In a real app, this would update the state or make an API call
              }}
                      title="Remove insight"
            >
                      <X className="h-3 w-3" />
            </button>
            <button 
                      className="p-1 rounded transition-colors"
                      style={{ 
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={(e) => {
                e.stopPropagation();
                        console.log('More options for insight', insight.id);
                        // TODO: Add functionality for insight options
              }}
                      title="More options"
            >
                      <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        </div>
        
                {/* Confidence Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Confidence: {insight.confidence}/{insight.maxConfidence}
                    </span>
                  </div>
                </div>
                
                {/* Confidence Progress Bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(insight.confidence / insight.maxConfidence) * 100}%`,
                      backgroundColor: insight.confidence >= 8 ? '#10b981' : insight.confidence >= 6 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Assistant Section - FIXED AT BOTTOM */}
      <div 
        className="flex flex-col border-t border-l"
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: `${rightSectionWidth}px`,
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
          zIndex: 25
        }}
      >
        <div 
          className="flex items-center justify-between p-4 cursor-pointer transition-colors border-t"
          style={{ 
            backgroundColor: 'transparent',
            borderColor: 'var(--border-primary)'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => toggleSection('aiAssistant')}
        >
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Chat Assistant</span>
          </div>
          <div className="flex items-center space-x-2">
            {expandedSections.aiAssistant ? (
              <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            )}
          </div>
        </div>
        
        {expandedSections.aiAssistant && (
          <div 
            className="flex flex-col border-t"
            style={{ 
              height: 'calc(100vh - 200px)',
              borderColor: 'var(--border-primary)'
            }}
          >
            {/* Messages - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => {
                // Handle narrative messages differently
                if (message.role === 'narrative') {
                  return (
                    <div key={message.id} className="w-full">
                      <div className="narrative-item narrative-info">
                        <span className="narrative-text">{message.content}</span>
                        <span className="narrative-timestamp">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Handle regular messages
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: message.type === 'user' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                        color: message.type === 'user' ? 'var(--text-primary)' : 'var(--text-primary)',
                        border: message.type === 'user' ? '1px solid var(--border-primary)' : '1px solid var(--border-primary)'
                      }}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'assistant' && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <Bot className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <User className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about EMEA Financial Services consulting..."
                    className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-500"
                    rows={1}
                    style={{ 
                      minHeight: '44px', 
                      maxHeight: '120px',
                      backgroundColor: '#ffffff',
                      color: '#1f2937',
                      border: '1px solid #d1d5db',
                      height: '44px',
                      overflow: 'hidden'
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-primary)';
                  }}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-2 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                Press Enter to send, Ctrl+Enter for new line
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}