/**
 * Insight Class - Manages insights extracted from materials with confidence scores and source tracking
 */
export class Insight {
  constructor({
    id,
    title,
    content,
    confidence = 0.8, // 0.0 to 1.0
    source = null,
    sourceType = 'document', // 'document', 'web', 'interview', 'research'
    tags = [],
    createdAt = new Date(),
    updatedAt = new Date(),
    usageCount = 0,
    lastUsed = null,
    metadata = {}
  }) {
    this.id = id || `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = title;
    this.content = content;
    this.confidence = Math.max(0.0, Math.min(1.0, confidence)); // Ensure 0.0 to 1.0
    this.source = source;
    this.sourceType = sourceType;
    this.tags = tags;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.usageCount = usageCount;
    this.lastUsed = lastUsed;
    this.metadata = metadata;
  }

  /**
   * Update insight content
   */
  updateContent(newContent) {
    this.content = newContent;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Update confidence score
   */
  updateConfidence(newConfidence) {
    const confidence = Math.max(0.0, Math.min(1.0, newConfidence));
    this.confidence = confidence;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Add tags
   */
  addTags(newTags) {
    if (Array.isArray(newTags)) {
      newTags.forEach(tag => {
        if (!this.tags.includes(tag)) {
          this.tags.push(tag);
        }
      });
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Remove tags
   */
  removeTags(tagsToRemove) {
    if (Array.isArray(tagsToRemove)) {
      this.tags = this.tags.filter(tag => !tagsToRemove.includes(tag));
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Mark insight as used
   */
  markAsUsed() {
    this.usageCount++;
    this.lastUsed = new Date();
    return true;
  }

  /**
   * Get confidence level description
   */
  getConfidenceLevel() {
    if (this.confidence >= 0.9) return 'Very High';
    if (this.confidence >= 0.8) return 'High';
    if (this.confidence >= 0.7) return 'Medium-High';
    if (this.confidence >= 0.6) return 'Medium';
    if (this.confidence >= 0.5) return 'Medium-Low';
    if (this.confidence >= 0.4) return 'Low';
    return 'Very Low';
  }

  /**
   * Get confidence color for UI
   */
  getConfidenceColor() {
    if (this.confidence >= 0.8) return 'success';
    if (this.confidence >= 0.6) return 'warning';
    return 'error';
  }

  /**
   * Check if insight is recent (within last 30 days)
   */
  isRecent() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.createdAt > thirtyDaysAgo;
  }

  /**
   * Get insight summary for display
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      content: this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content,
      confidence: this.confidence,
      confidenceLevel: this.getConfidenceLevel(),
      confidenceColor: this.getConfidenceColor(),
      source: this.source,
      sourceType: this.sourceType,
      tags: this.tags,
      usageCount: this.usageCount,
      isRecent: this.isRecent(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      confidence: this.confidence,
      source: this.source,
      sourceType: this.sourceType,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      usageCount: this.usageCount,
      lastUsed: this.lastUsed,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new Insight({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      lastUsed: json.lastUsed ? new Date(json.lastUsed) : null
    });
  }

  /**
   * Create a new insight
   */
  static create(title, content, source = null, confidence = 0.8) {
    return new Insight({
      title,
      content,
      source,
      confidence
    });
  }
}

export default Insight;
