import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  job_title: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  phone_number: {
    type: String,
    trim: true
  },
  email_address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  linkedin_url: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  languages_spoken: [{
    type: String
  }],
  industry_expertise: [{
    type: String
  }],
  area_of_expertise: [{
    type: String
  }],
  clients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  deliverables: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deliverable'
  }],
  tags: [{
    type: String
  }],
  notification_preferences: {
    email_notifications: {
      type: Boolean,
      default: true
    },
    project_updates: {
      type: Boolean,
      default: true
    },
    deliverable_deadlines: {
      type: Boolean,
      default: true
    },
    client_communications: {
      type: Boolean,
      default: true
    },
    system_notifications: {
      type: Boolean,
      default: true
    }
  },
  app_preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    dashboard_layout: {
      type: String,
      enum: ['compact', 'comfortable', 'spacious'],
      default: 'comfortable'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  two_fa: {
    enabled: {
      type: Boolean,
      default: false
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  },
  organisation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better performance
userSchema.index({ organisation: 1 });
userSchema.index({ is_active: 1 });
userSchema.index({ job_title: 1 });
userSchema.index({ industry_expertise: 1 });

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ is_active: true });
};

// Virtual for full name
userSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updated_at
userSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.last_login = new Date();
  return this.save();
};

// Check if model is already compiled
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
