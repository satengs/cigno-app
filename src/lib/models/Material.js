/**
 * Material Class - Manages key materials and source documents for deliverables
 */
export class Material {
  constructor({
    id,
    title,
    description = '',
    type = 'document', // 'document', 'pdf', 'web', 'interview', 'research', 'presentation'
    url = null,
    filePath = null,
    content = '',
    relevanceScore = 0.8, // 0.0 to 1.0
    tags = [],
    version = '1.0',
    createdAt = new Date(),
    updatedAt = new Date(),
    lastAccessed = null,
    accessCount = 0,
    metadata = {},
    insights = [] // Array of insight IDs extracted from this material
  }) {
    this.id = id || `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = title;
    this.description = description;
    this.type = type;
    this.url = url;
    this.filePath = filePath;
    this.content = content;
    this.relevanceScore = Math.max(0.0, Math.min(1.0, relevanceScore));
    this.tags = tags;
    this.version = version;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lastAccessed = lastAccessed;
    this.accessCount = accessCount;
    this.metadata = metadata;
    this.insights = insights;
  }

  /**
   * Update material content
   */
  updateContent(newContent) {
    this.content = newContent;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Update relevance score
   */
  updateRelevanceScore(newScore) {
    const score = Math.max(0.0, Math.min(1.0, newScore));
    this.relevanceScore = score;
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
   * Mark material as accessed
   */
  markAsAccessed() {
    this.accessCount++;
    this.lastAccessed = new Date();
    return true;
  }

  /**
   * Add insight extracted from this material
   */
  addInsight(insightId) {
    if (!this.insights.includes(insightId)) {
      this.insights.push(insightId);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Remove insight
   */
  removeInsight(insightId) {
    const index = this.insights.indexOf(insightId);
    if (index !== -1) {
      this.insights.splice(index, 1);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get relevance level description
   */
  getRelevanceLevel() {
    if (this.relevanceScore >= 0.9) return 'Very High';
    if (this.relevanceScore >= 0.8) return 'High';
    if (this.relevanceScore >= 0.7) return 'Medium-High';
    if (this.relevanceScore >= 0.6) return 'Medium';
    if (this.relevanceScore >= 0.5) return 'Medium-Low';
    if (this.relevanceScore >= 0.4) return 'Low';
    return 'Very Low';
  }

  /**
   * Get relevance color for UI
   */
  getRelevanceColor() {
    if (this.relevanceScore >= 0.8) return 'success';
    if (this.relevanceScore >= 0.6) return 'warning';
    return 'error';
  }

  /**
   * Check if material is recent (within last 30 days)
   */
  isRecent() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.createdAt > thirtyDaysAgo;
  }

  /**
   * Get material summary for display
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      type: this.type,
      relevanceScore: this.relevanceScore,
      relevanceLevel: this.getRelevanceLevel(),
      relevanceColor: this.getRelevanceColor(),
      tags: this.tags,
      version: this.version,
      insightsCount: this.insights.length,
      accessCount: this.accessCount,
      isRecent: this.isRecent(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Get material preview (first 200 characters)
   */
  getPreview() {
    if (this.content.length > 200) {
      return this.content.substring(0, 200) + '...';
    }
    return this.content;
  }

  /**
   * Check if material has content
   */
  hasContent() {
    return this.content && this.content.trim().length > 0;
  }

  /**
   * Check if material is accessible (has URL or file path)
   */
  isAccessible() {
    return this.url || this.filePath;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      type: this.type,
      url: this.url,
      filePath: this.filePath,
      content: this.content,
      relevanceScore: this.relevanceScore,
      tags: this.tags,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastAccessed: this.lastAccessed,
      accessCount: this.accessCount,
      metadata: this.metadata,
      insights: this.insights
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new Material({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      lastAccessed: json.lastAccessed ? new Date(json.lastAccessed) : null
    });
  }

  /**
   * Create a new material
   */
  static create(title, description = '', type = 'document', content = '') {
    return new Material({
      title,
      description,
      type,
      content
    });
  }

  /**
   * Create a web material
   */
  static createWeb(title, url, description = '') {
    return new Material({
      title,
      description,
      type: 'web',
      url
    });
  }

  /**
   * Create a document material
   */
  static createDocument(title, filePath, description = '') {
    return new Material({
      title,
      description,
      type: 'document',
      filePath
    });
  }
}

export default Material;
