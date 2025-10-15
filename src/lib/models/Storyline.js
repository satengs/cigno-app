import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  markdown: {
    type: String
  },
  html: {
    type: String
  },
  charts: [{
    id: {
      type: String
    },
    title: {
      type: String
    },
    caption: {
      type: String
    },
    source: {
      type: String
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    raw: {
      type: String
    }
  }],
  status: {
    type: String,
    enum: ['not_started', 'draft', 'in_review', 'final', 'locked'],
    default: 'not_started'
  },
  order: {
    type: Number,
    required: true
  },
  keyPoints: [{
    type: String,
    maxlength: 500
  }],
  contentBlocks: [{
    type: {
      type: String,
      enum: ['BCG Matrix', 'MECE Framework', 'Timeline Layout', 'Process Flow', 'Market Map', 'Key Insights', 'Case Study', 'Data Visualization', 'Content Block'],
      default: 'Content Block'
    },
    items: [{
      type: String
    }]
  }],
  locked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const storylineSchema = new mongoose.Schema({
  deliverable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deliverable',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  executiveSummary: {
    type: String,
    maxlength: 2000
  },
  presentationFlow: {
    type: String,
    maxlength: 1000
  },
  callToAction: {
    type: String,
    maxlength: 1000
  },
  sections: [sectionSchema],
  totalSections: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generationSource: {
    type: String,
    enum: ['ai', 'manual', 'template'],
    default: 'ai'
  },
  aiPrompt: {
    type: String,
    maxlength: 2000
  },
  topic: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  audience: [{
    type: String,
    trim: true
  }],
  objectives: {
    type: String,
    maxlength: 1000
  },
  presentationStyle: {
    type: String,
    enum: ['consulting', 'academic', 'sales', 'technical', 'strategic'],
    default: 'consulting'
  },
  complexity: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  version: {
    type: String,
    default: '1.0'
  },
  status: {
    type: String,
    enum: ['draft', 'in_review', 'approved', 'final'],
    default: 'draft'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better performance
storylineSchema.index({ deliverable: 1 });
storylineSchema.index({ deliverable: 1, is_active: 1 }, { unique: true }); // One active storyline per deliverable
storylineSchema.index({ status: 1 });
storylineSchema.index({ created_by: 1 });
storylineSchema.index({ is_active: 1 });
storylineSchema.index({ 'sections.status': 1 });
storylineSchema.index({ 'sections.locked': 1 });

// Virtual for completed sections count
storylineSchema.virtual('completedSectionsCount').get(function() {
  return this.sections ? this.sections.filter(s => s.status === 'final').length : 0;
});

// Virtual for locked sections count
storylineSchema.virtual('lockedSectionsCount').get(function() {
  return this.sections ? this.sections.filter(s => s.locked).length : 0;
});

// Pre-save middleware to update totalSections and estimated duration
storylineSchema.pre('save', function(next) {
  this.updated_at = new Date();
  this.totalSections = this.sections ? this.sections.length : 0;
  this.estimatedDuration = this.sections ? 
    this.sections.length * 2 : 0; // 2 min per section (each section = 1 slide)
  next();
});

// Instance method to lock a section
storylineSchema.methods.lockSection = function(sectionId, userId) {
  const section = this.sections.id(sectionId);
  if (section && !section.locked) {
    section.locked = true;
    section.lockedBy = userId;
    section.lockedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to unlock a section
storylineSchema.methods.unlockSection = function(sectionId, userId) {
  const section = this.sections.id(sectionId);
  if (section && section.locked && section.lockedBy?.equals(userId)) {
    section.locked = false;
    section.lockedBy = undefined;
    section.lockedAt = undefined;
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to update section status
storylineSchema.methods.updateSectionStatus = function(sectionId, status) {
  const section = this.sections.id(sectionId);
  if (section) {
    section.status = status;
    section.updated_at = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find active storylines
storylineSchema.statics.findActive = function() {
  return this.find({ is_active: true });
};

// Static method to find by deliverable
storylineSchema.statics.findByDeliverable = function(deliverableId) {
  return this.findOne({ deliverable: deliverableId, is_active: true })
    .populate('deliverable')
    .populate('created_by', 'name email')
    .populate('updated_by', 'name email')
    .populate('sections.lockedBy', 'name email');
};

// Check if model is already compiled
const Storyline = mongoose.models.Storyline || mongoose.model('Storyline', storylineSchema);

export default Storyline;
