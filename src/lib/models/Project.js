import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Planning', 'Active', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
    default: 'Planning'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  client_owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  internal_owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organisation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  },
  reference_documents: [{
    name: String,
    url: String,
    type: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  deliverables: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deliverable'
  }],
  budget: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD'],
      default: 'USD'
    },
    type: {
      type: String,
      enum: ['Fixed', 'Hourly', 'Retainer', 'Milestone'],
      default: 'Fixed'
    },
    allocated: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    }
  },
  team_members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  staffing: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['project_manager', 'consultant', 'analyst', 'specialist', 'reviewer', 'other'],
      default: 'consultant'
    },
    allocation_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    start_date: Date,
    end_date: Date,
    hourly_rate: Number,
    notes: String
  }],
  tags: [{
    type: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  project_type: {
    type: String,
    enum: ['consulting', 'development', 'design', 'analysis', 'strategy', 'other'],
    default: 'consulting'
  },
  communication_preferences: {
    update_frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi_weekly', 'monthly'],
      default: 'weekly'
    },
    reporting_format: {
      type: String,
      enum: ['email', 'dashboard', 'document', 'meeting'],
      default: 'email'
    }
  },
  resources: {
    internal: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        maxlength: 500
      },
      type: {
        type: String,
        enum: ['template', 'checklist', 'framework', 'guideline', 'other'],
        default: 'template'
      },
      source: {
        type: String,
        enum: ['auto-retrieved', 'added by user'],
        default: 'added by user'
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
      },
      is_selected: {
        type: Boolean,
        default: false
      }
    }],
    external: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        maxlength: 500
      },
      type: {
        type: String,
        enum: ['platform', 'tool', 'service', 'database', 'other'],
        default: 'platform'
      },
      source: {
        type: String,
        enum: ['auto-retrieved', 'added by user'],
        default: 'added by user'
      },
      is_selected: {
        type: Boolean,
        default: false
      }
    }]
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
projectSchema.index({ name: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ client_owner: 1 });
projectSchema.index({ internal_owner: 1 });
projectSchema.index({ organisation: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ start_date: 1 });
projectSchema.index({ end_date: 1 });
projectSchema.index({ is_active: 1 });

// Static method to find active projects
projectSchema.statics.findActive = function() {
  return this.find({ is_active: true });
};

// Virtual for deliverable count
projectSchema.virtual('deliverableCount').get(function() {
  return this.deliverables ? this.deliverables.length : 0;
});

// Virtual for team size
projectSchema.virtual('teamSize').get(function() {
  return this.team_members ? this.team_members.length : 0;
});

// Pre-save middleware to update updated_at
projectSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Instance method to add deliverable
projectSchema.methods.addDeliverable = function(deliverableId) {
  if (!this.deliverables.includes(deliverableId)) {
    this.deliverables.push(deliverableId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove deliverable
projectSchema.methods.removeDeliverable = function(deliverableId) {
  this.deliverables = this.deliverables.filter(id => !id.equals(deliverableId));
  return this.save();
};

// Instance method to add team member
projectSchema.methods.addTeamMember = function(userId) {
  if (!this.team_members.includes(userId)) {
    this.team_members.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove team member
projectSchema.methods.removeTeamMember = function(userId) {
  this.team_members = this.team_members.filter(id => !id.equals(userId));
  return this.save();
};

// Check if model is already compiled
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;
