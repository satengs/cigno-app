/**
 * Chat Communication Handler
 * Manages real-time chat communication with support for narrative messages
 * Handles different message types: status, chunk, complete, error, narrative
 */
export default class ChatCommunication {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onMessage = options.onMessage || (() => {});
    this.onError = options.onError || (() => {});
    this.narrativeContainer = null;
    this.isConnected = false;
    this.messageQueue = [];
    
    this.initializeContainer();
  }

  /**
   * Initialize the narrative container
   */
  initializeContainer() {
    // Create or find narrative container
    this.narrativeContainer = document.getElementById('narrative-container');
    if (!this.narrativeContainer) {
      this.narrativeContainer = document.createElement('div');
      this.narrativeContainer.id = 'narrative-container';
      this.narrativeContainer.className = 'narrative-container';
      this.container.appendChild(this.narrativeContainer);
    }
  }

  /**
   * Handle incoming WebSocket or API messages
   * @param {Object} data - Message data
   */
  handleMessage(data) {
    console.log('📨 Handling message:', data.type, data);

    switch (data.type) {
      case 'status':
        this.handleStatusUpdate(data);
        break;
        
      case 'chunk':
        this.handleChunkUpdate(data);
        break;
        
      case 'complete':
        this.handleComplete(data);
        break;
        
      case 'error':
        this.handleError(data);
        break;
        
      case 'narrative':
        this.handleNarrativeUpdate(data);
        break;
        
      default:
        console.warn('Unknown message type:', data.type);
        this.handleGenericMessage(data);
    }
  }

  /**
   * Handle narrative updates - display as live progress
   * @param {Object} data - Narrative message data
   */
  handleNarrativeUpdate(data) {
    console.log('📖 Processing narrative:', data.message);
    
    const narrativeElement = this.createNarrativeElement(data);
    this.narrativeContainer.appendChild(narrativeElement);
    
    // Auto-scroll to show latest narrative
    this.scrollToBottom();
    
    // Emit event for other components
    this.onMessage({
      type: 'narrative',
      content: data.message,
      element: narrativeElement,
      timestamp: data.timestamp
    });
  }

  /**
   * Create a narrative element with appropriate styling
   * @param {Object} data - Narrative data
   * @returns {HTMLElement} Styled narrative element
   */
  createNarrativeElement(data) {
    const element = document.createElement('div');
    element.className = 'narrative-item';
    
    // Detect emoji type and assign CSS class
    const cssClass = this.detectNarrativeType(data.message);
    element.classList.add(cssClass);
    
    // Create text content
    const textElement = document.createElement('span');
    textElement.className = 'narrative-text';
    textElement.textContent = data.message;
    
    element.appendChild(textElement);
    
    // Add timestamp if available
    if (data.timestamp) {
      const timeElement = document.createElement('span');
      timeElement.className = 'narrative-timestamp';
      timeElement.textContent = this.formatTimestamp(data.timestamp);
      element.appendChild(timeElement);
    }
    
    return element;
  }

  /**
   * Detect narrative type based on emoji content
   * @param {string} message - Message with potential emoji
   * @returns {string} CSS class name
   */
  detectNarrativeType(message) {
    // Success indicators
    if (message.includes('✓') || message.includes('🎯') || message.includes('📄')) {
      return 'narrative-success';
    }
    
    // Progress indicators
    if (message.includes('🔍') || message.includes('🌐') || message.includes('🔬') || message.includes('🔄')) {
      return 'narrative-progress';
    }
    
    // Transition indicators
    if (message.includes('⚡') || message.includes('🔧') || message.includes('📡') || message.includes('✏️')) {
      return 'narrative-warning';
    }
    
    // Error indicators
    if (message.includes('❌') || message.includes('⚠️')) {
      return 'narrative-error';
    }
    
    // Default info
    return 'narrative-info';
  }

  /**
   * Handle status updates (typing indicators, etc.)
   * @param {Object} data - Status data
   */
  handleStatusUpdate(data) {
    console.log('📊 Status update:', data.message, data.progress);
    
    // Show typing indicator or progress
    this.showStatusIndicator(data.message, data.progress);
    
    this.onMessage({
      type: 'status',
      content: data.message,
      progress: data.progress,
      timestamp: data.timestamp
    });
  }

  /**
   * Handle chunk updates (streaming content)
   * @param {Object} data - Chunk data
   */
  handleChunkUpdate(data) {
    console.log('📝 Chunk update:', data.content);
    
    // Update current message or create new one
    this.updateStreamingMessage(data.content, data.isComplete);
    
    this.onMessage({
      type: 'chunk',
      content: data.content,
      isComplete: data.isComplete,
      timestamp: data.timestamp
    });
  }

  /**
   * Handle completion
   * @param {Object} data - Completion data
   */
  handleComplete(data) {
    console.log('✅ Message complete');
    
    this.hideStatusIndicator();
    
    this.onMessage({
      type: 'complete',
      timestamp: data.timestamp || new Date().toISOString()
    });
  }

  /**
   * Handle errors
   * @param {Object} data - Error data
   */
  handleError(data) {
    console.error('❌ Chat error:', data.message, data.details);
    
    this.hideStatusIndicator();
    this.showErrorMessage(data.message);
    
    this.onError({
      type: 'error',
      message: data.message,
      details: data.details,
      timestamp: data.timestamp
    });
  }

  /**
   * Handle generic messages
   * @param {Object} data - Generic message data
   */
  handleGenericMessage(data) {
    console.log('📄 Generic message:', data);
    
    this.onMessage({
      type: 'generic',
      content: data,
      timestamp: data.timestamp || new Date().toISOString()
    });
  }

  /**
   * Show status indicator (typing, progress, etc.)
   * @param {string} message - Status message
   * @param {number} progress - Progress percentage
   */
  showStatusIndicator(message, progress = 0) {
    let indicator = document.getElementById('status-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'status-indicator';
      indicator.className = 'status-indicator';
      this.container.appendChild(indicator);
    }
    
    indicator.innerHTML = `
      <div class="status-content">
        <div class="status-message">${message}</div>
        ${progress > 0 ? `<div class="status-progress">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>` : ''}
      </div>
    `;
    
    indicator.style.display = 'block';
  }

  /**
   * Hide status indicator
   */
  hideStatusIndicator() {
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  /**
   * Update streaming message content
   * @param {string} content - New content
   * @param {boolean} isComplete - Whether streaming is complete
   */
  updateStreamingMessage(content, isComplete = false) {
    let messageElement = document.getElementById('streaming-message');
    
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.id = 'streaming-message';
      messageElement.className = 'streaming-message';
      this.container.appendChild(messageElement);
    }
    
    messageElement.innerHTML = content;
    
    if (isComplete) {
      messageElement.id = `message-${Date.now()}`;
      messageElement.className = 'message-complete';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message narrative-error';
    errorElement.innerHTML = `
      <span class="narrative-text">❌ ${message}</span>
      <span class="narrative-timestamp">${this.formatTimestamp(new Date().toISOString())}</span>
    `;
    
    this.narrativeContainer.appendChild(errorElement);
    this.scrollToBottom();
  }

  /**
   * Scroll to bottom of narrative container
   */
  scrollToBottom() {
    if (this.narrativeContainer) {
      this.narrativeContainer.scrollTop = this.narrativeContainer.scrollHeight;
    }
  }

  /**
   * Format timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Clear all narratives
   */
  clearNarratives() {
    if (this.narrativeContainer) {
      this.narrativeContainer.innerHTML = '';
    }
  }

  /**
   * Get all narrative messages
   * @returns {Array} Array of narrative elements
   */
  getNarratives() {
    return Array.from(this.narrativeContainer?.children || []);
  }

  /**
   * Connect to chat service
   * @param {Object} service - Chat service instance
   */
  connect(service) {
    this.isConnected = true;
    this.service = service;
    
    // Process queued messages
    this.messageQueue.forEach(message => this.handleMessage(message));
    this.messageQueue = [];
  }

  /**
   * Disconnect from chat service
   */
  disconnect() {
    this.isConnected = false;
    this.service = null;
    this.hideStatusIndicator();
  }
}
