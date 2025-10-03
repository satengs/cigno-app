import mongoose from 'mongoose';

const deliverableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  format: {
    type: String,
    enum: ['PDF', 'DOCX', 'PPTX', 'XLSX', 'HTML', 'TXT', 'IMAGE', 'VIDEO', 'AUDIO', 'OTHER'],
    default: 'PDF'
  },
  type: {
    type: String,
    enum: ['Presentation', 'Report', 'Strategy', 'Analysis', 'Design', 'Code', 'Documentation', 'Other'],
    default: 'Report'
  },
  length: {
    type: Number, // Pages, words, minutes, etc.
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'in_review', 'approved', 'in_progress', 'completed', 'delivered', 'rejected'],
    default: 'draft'
  },
  brief: {
    type: String,
    required: true,
    maxlength: 2000
  },
  version: {
    type: String,
    default: '1.0'
  },
  language: {
    type: String,
    default: 'en'
  },
  watermark: {
    enabled: {
      type: Boolean,
      default: false
    },
    text: String,
    position: {
      type: String,
      enum: ['top_left', 'top_right', 'bottom_left', 'bottom_right', 'center'],
      default: 'bottom_right'
    }
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assigned_to: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  due_date: {
    type: Date,
    required: true
  },
  delivered_date: {
    type: Date
  },
  tags: [{
    type: String
  }],
  file_url: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  estimated_hours: {
    type: Number,
    default: 0
  },
  metrics: {
    pages_count: {
      type: Number,
      default: 0
    },
    word_count: {
      type: Number,
      default: 0
    },
    reading_time_minutes: {
      type: Number,
      default: 0
    },
    file_size_mb: {
      type: Number,
      default: 0
    },
    views_count: {
      type: Number,
      default: 0
    },
    download_count: {
      type: Number,
      default: 0
    },
    last_viewed: Date,
    completion_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  notes: {
    type: String,
    maxlength: 2000
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
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better performance
deliverableSchema.index({ name: 1 });
deliverableSchema.index({ project: 1 });
deliverableSchema.index({ status: 1 });
deliverableSchema.index({ due_date: 1 });
deliverableSchema.index({ type: 1 });
deliverableSchema.index({ priority: 1 });
deliverableSchema.index({ is_active: 1 });

// Only add methods and virtuals if schema isn't already compiled
if (!mongoose.models.Deliverable) {
  // Static method to find active deliverables
  deliverableSchema.statics.findActive = function() {
    return this.find({ is_active: true });
  };

  // Virtual for assigned users count
  deliverableSchema.virtual('assignedUsersCount').get(function() {
    return this.assigned_to ? this.assigned_to.length : 0;
  });

  // Virtual for storyline
  deliverableSchema.virtual('storyline', {
    ref: 'Storyline',
    localField: '_id',
    foreignField: 'deliverable',
    justOne: true
  });

  // Pre-save middleware to update updated_at
  deliverableSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
  });

  // Instance method to assign user
  deliverableSchema.methods.assignUser = function(userId) {
    if (!this.assigned_to.includes(userId)) {
      this.assigned_to.push(userId);
      return this.save();
    }
    return Promise.resolve(this);
  };

  // Instance method to unassign user
  deliverableSchema.methods.unassignUser = function(userId) {
    this.assigned_to = this.assigned_to.filter(id => !id.equals(userId));
    return this.save();
  };

  // Instance method to update status
  deliverableSchema.methods.updateStatus = function(status) {
    this.status = status;
    if (status === 'delivered') {
      this.delivered_date = new Date();
    }
    return this.save();
  };
}

// Check if model is already compiled
const Deliverable = mongoose.models.Deliverable || mongoose.model('Deliverable', deliverableSchema);

export default Deliverable;
