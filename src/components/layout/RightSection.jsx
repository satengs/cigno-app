'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  TrendingUp,
  Layout,
  Check,
  Download,
  FileText,
  Presentation,
  Sheet
} from 'lucide-react';
import { authService } from '../../lib/auth/AuthService';
import { useStorylineExport } from '../../lib/export/exportUtils';
import ExportPreviewModal from '../ui/ExportPreviewModal';
import chatContextManager from '../../lib/chat/ChatContextManager';
import documentService, { KNOWLEDGE_BASE_IDS } from '../../lib/services/DocumentService';
import DocumentCard from '../ui/DocumentCard';

export default function RightSection({ isModalOpen = false, selectedItem = null, showLayoutOptions = false, selectedLayout = 'title-2-columns', onLayoutChange, storyline = null, onApplyLayoutToAll }) {
  // State for collapsible sections - chat closed by default
  const [expandedSections, setExpandedSections] = useState({
    layoutOptions: true, // Default to expanded
    internalResources: true,
    externalResources: true,
    relatedInsights: true,
    aiAssistant: false // Chat closed by default
  });

  // Export functionality
  const { download } = useStorylineExport(storyline, selectedLayout);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleExport = async (format) => {
    if (!storyline || !storyline.sections?.length) {
      console.warn('No storyline data available for export');
      return;
    }

    setIsExporting(true);
    try {
      await download(format);
      console.log(`✅ Successfully exported storyline as ${format.toUpperCase()}`);
    } catch (error) {
      console.error(`❌ Export failed for ${format}:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  // Layout selection is now managed by parent component

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


  // AI Assistant state - now managed by ChatContextManager
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentChatContext, setCurrentChatContext] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Resize state
  const [rightSectionWidth, setRightSectionWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null);
  const [internalResourcesFlex, setInternalResourcesFlex] = useState(1);
  const [externalResourcesFlex, setExternalResourcesFlex] = useState(1);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  // Documents state
  const [internalDocuments, setInternalDocuments] = useState([]);
  const [externalDocuments, setExternalDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);

  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Force close other sections when AI assistant opens
  useEffect(() => {
    if (expandedSections.aiAssistant) {
      setExpandedSections(prev => ({
        ...prev,
        layoutOptions: false
      }));
    }
  }, [expandedSections.aiAssistant]);

  // Note: AI assistant is not auto-opened, user must manually click to expand it

  // Fetch documents when a deliverable is selected
  useEffect(() => {
    const fetchDocuments = async () => {
      if (selectedItem?.type !== 'deliverable') {
        setInternalDocuments([]);
        setExternalDocuments([]);
        return;
      }

      setIsLoadingDocuments(true);
      setDocumentsError(null);

      try {
        console.log('📚 Fetching documents for deliverable:', selectedItem.name);

        // Fetch internal and external documents in parallel
        const [internal, external] = await Promise.all([
          documentService.fetchDocuments(KNOWLEDGE_BASE_IDS.INTERNAL).catch(err => {
            console.warn('Could not fetch internal documents:', err.message);
            return [];
          }),
          documentService.fetchDocuments(KNOWLEDGE_BASE_IDS.EXTERNAL, {
            excludeTitleContains: ['ubs']
          }).catch(err => {
            console.warn('Could not fetch external documents:', err.message);
            return [];
          })
        ]);

        setInternalDocuments(internal || []);
        setExternalDocuments(external || []);

        console.log('✅ Documents loaded:', {
          internal: internal?.length || 0,
          external: external?.length || 0
        });
      } catch (error) {
        // Silently fail - don't show errors to users for missing documents
        console.warn('Documents fetch completed with warnings');
        setInternalDocuments([]);
        setExternalDocuments([]);
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [selectedItem]);


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

  // Fetch current user from database on component mount and reset chat history
  useEffect(() => {
    // Reset all chat history on page load
    chatContextManager.clearAllChatHistory();
    console.log('🔄 Reset all chat history on page load');
    
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          // Get the first user (admin user)
          const adminUser = data.users?.[0];
          if (adminUser) {
            setCurrentUser(adminUser);
            console.log('✅ Current user loaded:', adminUser.name || adminUser.email);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch current user:', error);
        // Fallback to default user
        setCurrentUser({ _id: 'admin-user', name: 'Admin User', email: 'admin@cigno.app' });
      }
    };

    fetchCurrentUser();
  }, []);

  // Handle project context switching ONLY when a project is directly selected
  useEffect(() => {
    if (!currentUser || !selectedItem) {
      return;
    }

    // Only switch chat context when a PROJECT is directly selected
    if (selectedItem.type === 'project') {
      console.log(`🔀 Switching to project chat: ${selectedItem.name}`);
      
      // Switch to project chat context
      const chatContext = chatContextManager.switchToProject(selectedItem, currentUser._id);
      
      if (chatContext) {
        setCurrentChatContext(chatContext);
        setMessages(chatContext.messages || []);
        console.log(`💬 Loaded ${chatContext.messages?.length || 0} messages for project: ${selectedItem.name}`);
      }
    }
    // For other item types (deliverables, clients), keep the current chat context
    // Don't switch or clear the chat - maintain the current project's chat
  }, [selectedItem, currentUser]);

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => {
      const newState = { ...prev };
      
      // If opening AI assistant, automatically close other sections
      if (sectionName === 'aiAssistant' && !prev[sectionName]) {
        newState.layoutOptions = false;
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

    // Add message to current chat context
    if (currentChatContext) {
      chatContextManager.addMessageToCurrentChat(userMessage);
      setMessages(chatContextManager.getCurrentMessages());
    } else {
      setMessages(prev => [...prev, userMessage]);
    }
    
    const currentInputValue = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Simple AI response for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I understand you're asking about "${currentInputValue}". I'm here to help with your project!`,
        timestamp: Date.now()
      };
      
      if (currentChatContext) {
        chatContextManager.addMessageToCurrentChat(aiResponse, {
          provider: 'simple-ai',
          responseTime: 1000
        });
        setMessages(chatContextManager.getCurrentMessages());
      } else {
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
  };

  const handleResize = (e) => {
    if (!isResizing || !resizeType) return;
    
    if (resizeType === 'width') {
      const newWidth = window.innerWidth - e.clientX;
      setRightSectionWidth(Math.max(200, Math.min(600, newWidth)));
    } else if (resizeType === 'resources-divider') {
      // For divider between internal and external resources
      // Adjust the flex ratios to redistribute space dynamically
      const deltaY = e.clientY - resizeStartY;
      const flexAdjustment = deltaY / 200; // Sensitivity factor for smoother resize
      
      const totalFlex = internalResourcesFlex + externalResourcesFlex;
      const newInternalFlex = Math.max(0.3, Math.min(3, internalResourcesFlex + flexAdjustment));
      const newExternalFlex = Math.max(0.3, totalFlex - newInternalFlex);
      
      setInternalResourcesFlex(newInternalFlex);
      setExternalResourcesFlex(newExternalFlex);
      setResizeStartY(e.clientY); // Update start position for continuous dragging
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
  }, [isResizing, resizeType, resizeStartY, internalResourcesFlex, externalResourcesFlex]);


  // Function to get dynamic insights based on selected content
  const getRelatedInsights = (selectedItem) => {
    // TODO: Replace with API call to get real insights
    // This will be replaced with actual API data
    if (!selectedItem) {
      return [];
    }
    return [];
  };

  // Layout options data
  const LAYOUT_OPTIONS = [
    {
      id: 'title-2-columns',
      name: 'Title + 2 Columns',
      description: 'Header with two equal content columns',
      recommended: true,
      preview: (
        <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
          <div className="flex gap-1 p-1 h-12">
            <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          </div>
        </div>
      )
    },
    {
      id: 'bcg-matrix',
      name: 'BCG Matrix',
      description: '2x2 matrix for strategic analysis',
      preview: (
        <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="h-2 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
          <div className="grid grid-cols-2 gap-1 p-1 h-11">
            <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          </div>
        </div>
      )
    },
    {
      id: 'three-columns',
      name: '3 Columns',
      description: 'Three equal content columns',
      preview: (
        <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
          <div className="flex gap-1 p-1 h-12">
            <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          </div>
        </div>
      )
    },
    {
      id: 'full-width',
      name: 'Full Width',
      description: 'Single column full width content',
      preview: (
        <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
          <div className="p-1 h-12">
            <div className="w-full h-full rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          </div>
        </div>
      )
    },
    {
      id: 'timeline',
      name: 'Timeline Layout',
      description: 'Horizontal timeline with milestones',
      preview: (
        <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
          <div className="p-1 h-12 flex items-center">
            <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
            <div className="w-2 h-2 rounded-full mx-1" style={{ backgroundColor: 'var(--text-primary)' }}></div>
            <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
            <div className="w-2 h-2 rounded-full mx-1" style={{ backgroundColor: 'var(--text-primary)' }}></div>
            <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          </div>
        </div>
      )
    },
    {
      id: 'process-flow',
      name: 'Process Flow',
      description: 'Sequential process with arrows',
      preview: (
        <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
          <div className="p-1 h-12 flex items-center justify-center gap-1">
            <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <div className="w-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
            <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <div className="w-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
            <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          </div>
        </div>
      )
    }
  ];


  const relatedInsights = getRelatedInsights(selectedItem);

  return (
    <div 
      className="flex flex-col h-full relative overflow-hidden border-l"
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


      {/* Layout Options Section - Replace Internal/External Resources when in layout mode */}
      {showLayoutOptions ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => toggleSection('layoutOptions')}
          >
            <div className="flex items-center space-x-2">
              <Layout className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              {expandedSections.layoutOptions ? (
                <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              )}
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Layout Options</span>
            </div>
          </div>
          
          {expandedSections.layoutOptions && (
            <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1">
              {LAYOUT_OPTIONS.map((layout) => (
                <div
                  key={layout.id}
                  onClick={() => onLayoutChange && onLayoutChange(layout.id)}
                  className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedLayout === layout.id
                      ? 'shadow-sm'
                      : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: selectedLayout === layout.id ? 'var(--text-primary)' : 'var(--border-primary)',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedLayout !== layout.id) {
                      e.target.style.borderColor = 'var(--border-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLayout !== layout.id) {
                      e.target.style.borderColor = 'var(--border-primary)';
                    }
                  }}
                >
                  {layout.recommended && (
                    <div className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--text-primary)' }}>
                      Recommended
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-12 flex-shrink-0">
                      {layout.preview}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {layout.name}
                        </h3>
                        {selectedLayout === layout.id && (
                          <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-primary)' }} />
                        )}
                      </div>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {layout.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Apply to All Slides Button */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <button
                  onClick={() => onApplyLayoutToAll && onApplyLayoutToAll(selectedLayout)}
                  className="w-full px-4 py-2 text-white text-sm font-medium rounded transition-colors"
                  style={{ backgroundColor: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                  }}
                  title={`Apply ${LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.name || selectedLayout} to all slides`}
                >
                  Apply to All Slides
                </button>
              </div>

              {/* Export Options */}
              {storyline && storyline.sections?.length > 0 && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                    Export Storyline
                  </h4>
                  
                  {/* Preview & Export Button */}
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors"
                    style={{ 
                      backgroundColor: 'var(--text-primary)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExporting) {
                        e.target.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '1';
                    }}
                  >
                    <Eye size={16} />
                    {isExporting ? 'Exporting...' : 'Preview & Export'}
                  </button>

                  {/* Export Info */}
                  <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Download size={12} />
                      <span>Export will include:</span>
                    </div>
                    <ul className="text-xs space-y-0.5 ml-4">
                      <li>• All {storyline.sections?.length || 0} sections</li>
                      <li>• Applied layouts per section</li>
                      <li>• Content and key points</li>
                      <li>• Cigno branding</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 space-y-0">
          {/* Show resources only for deliverables, only chat for projects and clients */}
          {selectedItem?.type === 'deliverable' && (
            <>
              {/* Internal Resources Section */}
              <div className="flex flex-col min-h-0" style={{ flex: internalResourcesFlex }}>
                <div 
                  className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onClick={() => toggleSection('internalResources')}
                >
          <div className="flex items-center space-x-2 flex-1">
            {expandedSections.internalResources ? (
              <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            )}
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Internal Resource</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {isLoadingDocuments ? '...' : internalDocuments.length}
            </span>
          </div>
          <button 
            className="p-1 rounded transition-colors"
            style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add internal resource clicked');
            }}
            title="Add internal resource"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        {expandedSections.internalResources && (
          <div 
            className="flex flex-col flex-1 overflow-y-auto"
          >
            <div className="px-4 pt-4 pb-4 space-y-3">
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading resources...</span>
                  </div>
                </div>
              ) : internalDocuments.length > 0 ? (
                internalDocuments.map((doc, index) => (
                  <DocumentCard 
                    key={doc._id || doc.id || index}
                    document={doc}
                    type="internal"
                    index={index}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No internal resources available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resize handle between internal and external resources */}
      <div
        className="w-full h-3 cursor-row-resize flex items-center justify-center flex-shrink-0"
        style={{ 
          backgroundColor: 'transparent',
          borderTop: '1px solid var(--border-primary)'
        }}
        onMouseDown={startResize('resources-divider')}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          e.currentTarget.style.borderTop = '2px solid var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderTop = '1px solid var(--border-primary)';
        }}
        title="Drag to resize sections"
      >
        <div className="w-8 h-0.5 rounded" style={{ backgroundColor: 'var(--text-secondary)' }} />
      </div>

      {/* External Resources Section */}
      <div className="flex flex-col min-h-0" style={{ flex: externalResourcesFlex }}>
        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
          onClick={() => toggleSection('externalResources')}
        >
          <div className="flex items-center space-x-2 flex-1">
            {expandedSections.externalResources ? (
              <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            )}
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>External Resource</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {isLoadingDocuments ? '...' : externalDocuments.length}
            </span>
          </div>
          <button 
            className="p-1 rounded transition-colors"
            style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add external resource clicked');
            }}
            title="Add external resource"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        {expandedSections.externalResources && (
          <div 
            className="flex flex-col flex-1 overflow-y-auto"
          >
            <div className="px-4 pt-4 pb-4 space-y-3 flex-1">
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading resources...</span>
                  </div>
                </div>
              ) : externalDocuments.length > 0 ? (
                externalDocuments.map((doc, index) => (
                  <DocumentCard 
                    key={doc._id || doc.id || index}
                    document={doc}
                    type="external"
                    index={index}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No external resources available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Insights Section - Disabled for now */}
      {false && <div className="flex flex-col">
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
      }
            </>
          )}
        </div>
      )}

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
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        storyline={storyline}
        selectedLayout={selectedLayout}
        onExport={handleExport}
      />
    </div>
  );
}