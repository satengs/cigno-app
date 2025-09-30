/**
 * Section Class - Manages individual storyline sections with content, insights, and AI integration
 */
export class Section {
  constructor({
    id,
    title,
    summary = '',
    content = '',
    order = 0,
    insights = [], // Array of insight IDs
    isLocked = false,
    isPublished = false,
    createdAt = new Date(),
    updatedAt = new Date(),
    lastEdited = null,
    editCount = 0,
    aiGenerated = false,
    confidence = 0.8,
    metadata = {},
    feedback = [] // Array of feedback objects
  }) {
    this.id = id || `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = title;
    this.summary = summary;
    this.content = content;
    this.order = order;
    this.insights = insights;
    this.isLocked = isLocked;
    this.isPublished = isPublished;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lastEdited = lastEdited;
    this.editCount = editCount;
    this.aiGenerated = aiGenerated;
    this.confidence = Math.max(0.0, Math.min(1.0, confidence));
    this.metadata = metadata;
    this.feedback = feedback;
  }

  /**
   * Update section content
   */
  updateContent(newContent) {
    if (this.isLocked) {
      return { success: false, error: 'Section is locked' };
    }
    
    this.content = newContent;
    this.updatedAt = new Date();
    this.lastEdited = new Date();
    this.editCount++;
    
    return { success: true };
  }

  /**
   * Update section summary
   */
  updateSummary(newSummary) {
    if (this.isLocked) {
      return { success: false, error: 'Section is locked' };
    }
    
    this.summary = newSummary;
    this.updatedAt = new Date();
    
    return { success: true };
  }

  /**
   * Update section title
   */
  updateTitle(newTitle) {
    if (this.isLocked) {
      return { success: false, error: 'Section is locked' };
    }
    
    this.title = newTitle;
    this.updatedAt = new Date();
    
    return { success: true };
  }

  /**
   * Add insight to section
   */
  addInsight(insightId) {
    if (this.isLocked) {
      return { success: false, error: 'Section is locked' };
    }
    
    if (!this.insights.includes(insightId)) {
      this.insights.push(insightId);
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Insight already exists in section' };
  }

  /**
   * Remove insight from section
   */
  removeInsight(insightId) {
    if (this.isLocked) {
      return { success: false, error: 'Section is locked' };
    }
    
    const index = this.insights.indexOf(insightId);
    if (index !== -1) {
      this.insights.splice(index, 1);
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Insight not found in section' };
  }

  /**
   * Lock section
   */
  lock() {
    this.isLocked = true;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Unlock section
   */
  unlock() {
    this.isLocked = false;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Publish section
   */
  publish() {
    if (this.isLocked) {
      return { success: false, error: 'Cannot publish locked section' };
    }
    
    this.isPublished = true;
    this.updatedAt = new Date();
    return { success: true };
  }

  /**
   * Unpublish section
   */
  unpublish() {
    this.isPublished = false;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Mark as AI generated
   */
  markAsAIGenerated(confidence = 0.8) {
    this.aiGenerated = true;
    this.confidence = Math.max(0.0, Math.min(1.0, confidence));
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Add feedback to section
   */
  addFeedback(feedback) {
    if (this.isLocked) {
      return { success: false, error: 'Section is locked' };
    }
    
    const newFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: feedback.content,
      author: feedback.author,
      timestamp: new Date(),
      type: feedback.type || 'comment', // 'comment', 'suggestion', 'issue'
      status: feedback.status || 'open' // 'open', 'resolved', 'rejected'
    };
    
    this.feedback.push(newFeedback);
    this.updatedAt = new Date();
    
    return { success: true, feedback: newFeedback };
  }

  /**
   * Update feedback status
   */
  updateFeedbackStatus(feedbackId, newStatus) {
    const feedback = this.feedback.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.status = newStatus;
      feedback.updatedAt = new Date();
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Feedback not found' };
  }

  /**
   * Get section status
   */
  getStatus() {
    if (this.isLocked) return 'locked';
    if (this.isPublished) return 'published';
    if (this.content.trim().length > 0) return 'draft';
    return 'empty';
  }

  /**
   * Get section summary for display
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      summary: this.summary,
      content: this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content,
      order: this.order,
      insightsCount: this.insights.length,
      isLocked: this.isLocked,
      isPublished: this.isPublished,
      status: this.getStatus(),
      aiGenerated: this.aiGenerated,
      confidence: this.confidence,
      editCount: this.editCount,
      feedbackCount: this.feedback.length,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Check if section has content
   */
  hasContent() {
    return this.content && this.content.trim().length > 0;
  }

  /**
   * Check if section has insights
   */
  hasInsights() {
    return this.insights && this.insights.length > 0;
  }

  /**
   * Check if section can be edited
   */
  canEdit() {
    return !this.isLocked && !this.isPublished;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      summary: this.summary,
      content: this.content,
      order: this.order,
      insights: this.insights,
      isLocked: this.isLocked,
      isPublished: this.isPublished,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastEdited: this.lastEdited,
      editCount: this.editCount,
      aiGenerated: this.aiGenerated,
      confidence: this.confidence,
      metadata: this.metadata,
      feedback: this.feedback
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new Section({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      lastEdited: json.lastEdited ? new Date(json.lastEdited) : null
    });
  }

  /**
   * Create a new section
   */
  static create(title, summary = '', order = 0) {
    return new Section({
      title,
      summary,
      order
    });
  }

  /**
   * Create an AI-generated section
   */
  static createAIGenerated(title, content, summary = '', confidence = 0.8) {
    return new Section({
      title,
      content,
      summary,
      aiGenerated: true,
      confidence
    });
  }
}

export default Section;
