/**
 * ProgressiveResponseStreamer
 * Handles streaming of narrative messages with visual indicators
 * Supports real-time progress updates during AI processing
 */
export default class ProgressiveResponseStreamer {
  constructor(options = {}) {
    this.onChunk = options.onChunk || (() => {});
    this.onNarrative = options.onNarrative || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatus = options.onStatus || (() => {});
  }

  /**
   * Stream narrative messages with visual indicators
   * @param {string} message - The narrative message
   * @param {string} type - Type of narrative (discovery, progress, transition, error)
   * @param {Object} options - Additional options
   */
  streamNarrative(message, type = 'info', options = {}) {
    const narrativeMessage = {
      type: 'narrative',
      message: this.enhanceWithEmoji(message, type),
      timestamp: new Date().toISOString(),
      ...options
    };

    this.onNarrative(narrativeMessage);
  }

  /**
   * Stream status updates
   * @param {string} status - Status message
   * @param {number} progress - Progress percentage (0-100)
   */
  streamStatus(status, progress = 0) {
    const statusMessage = {
      type: 'status',
      message: status,
      progress: progress,
      timestamp: new Date().toISOString()
    };

    this.onStatus(statusMessage);
  }

  /**
   * Stream content chunks
   * @param {string} chunk - Content chunk
   * @param {boolean} isComplete - Whether this is the final chunk
   */
  streamChunk(chunk, isComplete = false) {
    const chunkMessage = {
      type: 'chunk',
      content: chunk,
      isComplete: isComplete,
      timestamp: new Date().toISOString()
    };

    this.onChunk(chunkMessage);

    if (isComplete) {
      this.onComplete();
    }
  }

  /**
   * Stream error messages
   * @param {string} error - Error message
   * @param {Object} details - Error details
   */
  streamError(error, details = {}) {
    const errorMessage = {
      type: 'error',
      message: error,
      details: details,
      timestamp: new Date().toISOString()
    };

    this.onError(errorMessage);
  }

  /**
   * Stream completion
   * @param {Object} data - Completion data
   */
  streamComplete(data = {}) {
    const completeMessage = {
      type: 'complete',
      timestamp: data.timestamp || new Date().toISOString()
    };

    this.onComplete(completeMessage);
  }

  /**
   * Enhance message with appropriate emoji based on type
   * @param {string} message - Original message
   * @param {string} type - Narrative type
   * @returns {string} Enhanced message with emoji
   */
  enhanceWithEmoji(message, type) {
    const emojiMap = {
      // Discovery narratives - Cigno consulting focused
      'discovery_success': '🎯', // Target achieved
      'discovery_partial': '🔍', // Partial findings
      'discovery_failure': '❌', // No findings
      
      // Progress narratives - EMEA Financial Services
      'progress_rag': '📊', // Knowledge base search
      'progress_web': '🌐', // Web research
      'progress_perplexity': '🔬', // AI research
      'progress_refined': '🔄', // Refined search
      
      // Transition narratives - Consulting workflow
      'transition_strategy': '⚡', // Strategy change
      'transition_refinement': '🔧', // Process refinement
      'transition_escalation': '📡', // Escalation
      'transition_reformulation': '✏️', // Query reformulation
      
      // Cigno-specific narratives
      'client_analysis': '👥', // Client analysis
      'regulatory_check': '📋', // Regulatory compliance
      'market_research': '📈', // Market analysis
      'deliverable_creation': '📄', // Document creation
      'team_collaboration': '🤝', // Team work
      'quality_assurance': '✅', // Quality check
      
      // General types
      'success': '✓',
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌'
    };

    const emoji = emojiMap[type] || emojiMap['info'];
    return `${emoji} ${message}`;
  }

  /**
   * Create narrative templates for Cigno consulting scenarios
   */
  static getNarrativeTemplates() {
    return {
      discovery: {
        success: "Found comprehensive information about {topic}",
        partial: "Found some relevant information about {topic}",
        failure: "Could not find specific information about {topic}"
      },
      progress: {
        rag: "Searching Cigno knowledge base for {query}",
        web: "Researching current EMEA financial services data for {query}",
        perplexity: "Querying AI research tools for {query}",
        refined: "Refining search based on initial findings"
      },
      transition: {
        strategy: "Adjusting research strategy for better results",
        refinement: "Refining search terms based on initial findings",
        escalation: "Escalating to advanced research methods",
        reformulation: "Reformulating query for better results"
      },
      cigno: {
        client_analysis: "Analyzing client requirements for {project}",
        regulatory_check: "Checking EMEA regulatory compliance for {topic}",
        market_research: "Conducting market analysis for {sector}",
        deliverable_creation: "Creating deliverable for {client}",
        team_collaboration: "Coordinating with team members on {task}",
        quality_assurance: "Performing quality check on {deliverable}"
      }
    };
  }

  /**
   * Generate a complete narrative sequence for a research task
   * @param {string} topic - The research topic
   * @param {Object} options - Configuration options
   */
  async generateResearchNarrative(topic, options = {}) {
    const templates = ProgressiveResponseStreamer.getNarrativeTemplates();
    
    // Start with discovery
    this.streamNarrative(
      templates.discovery.rag.replace('{query}', topic),
      'progress_rag'
    );

    // Simulate progress
    await this.delay(500);
    this.streamNarrative(
      templates.progress.web.replace('{query}', topic),
      'progress_web'
    );

    await this.delay(800);
    this.streamNarrative(
      templates.transition.refinement.replace('{query}', topic),
      'transition_refinement'
    );

    await this.delay(600);
    this.streamNarrative(
      templates.discovery.success.replace('{topic}', topic),
      'discovery_success'
    );
  }

  /**
   * Utility method for delays
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
