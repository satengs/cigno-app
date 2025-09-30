/**
 * Storyline Class - Manages the overall storyline structure with sections, AI generation, and content management
 */
export class Storyline {
  constructor({
    id,
    title,
    description = '',
    sections = [],
    status = 'draft', // 'draft', 'in-progress', 'review', 'final'
    targetAudience = '',
    keyMessages = [],
    createdAt = new Date(),
    updatedAt = new Date(),
    lastGenerated = null,
    generationCount = 0,
    aiGenerated = false,
    confidence = 0.8,
    metadata = {}
  }) {
    this.id = id || `storyline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = title;
    this.description = description;
    this.sections = sections;
    this.status = status;
    this.targetAudience = targetAudience;
    this.keyMessages = keyMessages;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lastGenerated = lastGenerated;
    this.generationCount = generationCount;
    this.aiGenerated = aiGenerated;
    this.confidence = Math.max(0.0, Math.min(1.0, confidence));
    this.metadata = metadata;
  }

  /**
   * Add section to storyline
   */
  addSection(section) {
    if (!section || !section.id) {
      return { success: false, error: 'Invalid section' };
    }
    
    // Check if section already exists
    if (this.sections.find(s => s.id === section.id)) {
      return { success: false, error: 'Section already exists' };
    }
    
    // Set order if not provided
    if (section.order === undefined || section.order === null) {
      section.order = this.sections.length;
    }
    
    this.sections.push(section);
    this._reorderSections();
    this.updatedAt = new Date();
    
    return { success: true, section };
  }

  /**
   * Remove section from storyline
   */
  removeSection(sectionId) {
    const index = this.sections.findIndex(s => s.id === sectionId);
    if (index !== -1) {
      this.sections.splice(index, 1);
      this._reorderSections();
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Section not found' };
  }

  /**
   * Update section in storyline
   */
  updateSection(sectionId, updates) {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      Object.assign(section, updates);
      section.updatedAt = new Date();
      this.updatedAt = new Date();
      return { success: true, section };
    }
    
    return { success: false, error: 'Section not found' };
  }

  /**
   * Reorder sections
   */
  reorderSections(newOrder) {
    if (!Array.isArray(newOrder) || newOrder.length !== this.sections.length) {
      return { success: false, error: 'Invalid order array' };
    }
    
    // Validate that all section IDs exist
    const sectionIds = this.sections.map(s => s.id);
    const isValidOrder = newOrder.every(id => sectionIds.includes(id));
    
    if (!isValidOrder) {
      return { success: false, error: 'Invalid section IDs in order array' };
    }
    
    // Reorder sections based on new order
    const reorderedSections = [];
    newOrder.forEach(sectionId => {
      const section = this.sections.find(s => s.id === sectionId);
      if (section) {
        reorderedSections.push(section);
      }
    });
    
    this.sections = reorderedSections;
    this._reorderSections();
    this.updatedAt = new Date();
    
    return { success: true };
  }

  /**
   * Move section up
   */
  moveSectionUp(sectionId) {
    const index = this.sections.findIndex(s => s.id === sectionId);
    if (index > 0) {
      [this.sections[index], this.sections[index - 1]] = [this.sections[index - 1], this.sections[index]];
      this._reorderSections();
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Section is already at the top' };
  }

  /**
   * Move section down
   */
  moveSectionDown(sectionId) {
    const index = this.sections.findIndex(s => s.id === sectionId);
    if (index < this.sections.length - 1) {
      [this.sections[index], this.sections[index + 1]] = [this.sections[index + 1], this.sections[index]];
      this._reorderSections();
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Section is already at the bottom' };
  }

  /**
   * Get section by ID
   */
  getSection(sectionId) {
    return this.sections.find(s => s.id === sectionId);
  }

  /**
   * Get section by order
   */
  getSectionByOrder(order) {
    return this.sections.find(s => s.order === order);
  }

  /**
   * Get all sections
   */
  getAllSections() {
    return [...this.sections].sort((a, b) => a.order - b.order);
  }

  /**
   * Get published sections only
   */
  getPublishedSections() {
    return this.sections.filter(s => s.isPublished).sort((a, b) => a.order - b.order);
  }

  /**
   * Update storyline status
   */
  updateStatus(newStatus) {
    const validStatuses = ['draft', 'in-progress', 'review', 'final'];
    if (validStatuses.includes(newStatus)) {
      this.status = newStatus;
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Invalid status' };
  }

  /**
   * Add key message
   */
  addKeyMessage(message) {
    if (message && !this.keyMessages.includes(message)) {
      this.keyMessages.push(message);
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Invalid message or already exists' };
  }

  /**
   * Remove key message
   */
  removeKeyMessage(message) {
    const index = this.keyMessages.indexOf(message);
    if (index !== -1) {
      this.keyMessages.splice(index, 1);
      this.updatedAt = new Date();
      return { success: true };
    }
    
    return { success: false, error: 'Message not found' };
  }

  /**
   * Mark as AI generated
   */
  markAsAIGenerated(confidence = 0.8) {
    this.aiGenerated = true;
    this.confidence = Math.max(0.0, Math.min(1.0, confidence));
    this.lastGenerated = new Date();
    this.generationCount++;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Get storyline summary
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      sectionsCount: this.sections.length,
      publishedSectionsCount: this.getPublishedSections().length,
      status: this.status,
      targetAudience: this.targetAudience,
      keyMessagesCount: this.keyMessages.length,
      aiGenerated: this.aiGenerated,
      confidence: this.confidence,
      generationCount: this.generationCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastGenerated: this.lastGenerated
    };
  }

  /**
   * Get storyline statistics
   */
  getStatistics() {
    const totalSections = this.sections.length;
    const publishedSections = this.sections.filter(s => s.isPublished).length;
    const lockedSections = this.sections.filter(s => s.isLocked).length;
    const aiGeneratedSections = this.sections.filter(s => s.aiGenerated).length;
    
    return {
      totalSections,
      publishedSections,
      draftSections: totalSections - publishedSections,
      lockedSections,
      unlockedSections: totalSections - lockedSections,
      aiGeneratedSections,
      humanGeneratedSections: totalSections - aiGeneratedSections,
      completionRate: totalSections > 0 ? (publishedSections / totalSections) * 100 : 0
    };
  }

  /**
   * Check if storyline is complete
   */
  isComplete() {
    return this.sections.length > 0 && this.sections.every(s => s.isPublished);
  }

  /**
   * Check if storyline has content
   */
  hasContent() {
    return this.sections.some(s => s.hasContent());
  }

  /**
   * Private method to reorder sections
   */
  _reorderSections() {
    this.sections.forEach((section, index) => {
      section.order = index;
    });
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      sections: this.sections.map(s => s.toJSON()),
      status: this.status,
      targetAudience: this.targetAudience,
      keyMessages: this.keyMessages,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastGenerated: this.lastGenerated,
      generationCount: this.generationCount,
      aiGenerated: this.aiGenerated,
      confidence: this.confidence,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new Storyline({
      ...json,
      sections: json.sections ? json.sections.map(s => Section.fromJSON(s)) : [],
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      lastGenerated: json.lastGenerated ? new Date(json.lastGenerated) : null
    });
  }

  /**
   * Create a new storyline
   */
  static create(title, description = '') {
    return new Storyline({
      title,
      description
    });
  }

  /**
   * Create an AI-generated storyline
   */
  static createAIGenerated(title, description = '', sections = [], confidence = 0.8) {
    return new Storyline({
      title,
      description,
      sections,
      aiGenerated: true,
      confidence
    });
  }
}

export default Storyline;
