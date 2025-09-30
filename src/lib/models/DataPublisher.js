import mongoose from 'mongoose';

const dataPublisherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  languages: [{
    type: String,
    required: true
  }],
  content: {
    type: String,
    required: true
  },
  content_type: {
    type: String,
    enum: ['api', 'rss', 'web_scraping', 'file_upload', 'manual_entry'],
    default: 'manual_entry'
  },
  update_frequency: {
    type: String,
    enum: ['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'manual'],
    default: 'manual'
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true
  },
  organisation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  tags: [{
    type: String
  }],
  metadata: {
    description: String,
    category: String,
    reliability_score: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    },
    data_quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    access_level: {
      type: String,
      enum: ['public', 'restricted', 'private'],
      default: 'public'
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better performance
dataPublisherSchema.index({ name: 1 });
dataPublisherSchema.index({ organisation: 1 });
dataPublisherSchema.index({ content_type: 1 });
dataPublisherSchema.index({ is_active: 1 });
dataPublisherSchema.index({ last_updated: 1 });
dataPublisherSchema.index({ tags: 1 });

// Static method to find active data publishers
dataPublisherSchema.statics.findActive = function() {
  return this.find({ is_active: true });
};

// Virtual for project count
dataPublisherSchema.virtual('projectCount').get(function() {
  return this.projects ? this.projects.length : 0;
});

// Pre-save middleware to update updated_at
dataPublisherSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Instance method to add project
dataPublisherSchema.methods.addProject = function(projectId) {
  if (!this.projects.includes(projectId)) {
    this.projects.push(projectId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove project
dataPublisherSchema.methods.removeProject = function(projectId) {
  this.projects = this.projects.filter(id => !id.equals(projectId));
  return this.save();
};

// Instance method to update content
dataPublisherSchema.methods.updateContent = function(newContent) {
  this.content = newContent;
  this.last_updated = new Date();
  return this.save();
};

// Check if model is already compiled
const DataPublisher = mongoose.models.DataPublisher || mongoose.model('DataPublisher', dataPublisherSchema);

export default DataPublisher;
