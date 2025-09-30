import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email_address: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  linkedin_url: {
    type: String,
    trim: true
  },
  languages_spoken: [{
    type: String
  }],
  phone_number: {
    type: String,
    trim: true
  },
  job_title: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  is_primary_contact: {
    type: Boolean,
    default: false
  },
  communication_preferences: {
    preferred_method: {
      type: String,
      enum: ['email', 'phone', 'linkedin'],
      default: 'email'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    availability: {
      type: String,
      enum: ['business_hours', 'flexible', 'weekends_ok'],
      default: 'business_hours'
    }
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String
  }],
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
contactSchema.index({ email_address: 1 });
contactSchema.index({ client: 1 });
contactSchema.index({ is_active: 1 });
contactSchema.index({ is_primary_contact: 1 });
contactSchema.index({ name: 1 });


// Pre-save middleware to ensure only one primary contact per client
contactSchema.pre('save', async function(next) {
  if (this.is_primary_contact && this.isModified('is_primary_contact')) {
    // Remove primary status from other contacts of the same client
    await this.constructor.updateMany(
      { 
        client: this.client, 
        _id: { $ne: this._id },
        is_primary_contact: true 
      },
      { is_primary_contact: false }
    );
  }
  next();
});

// Pre-save middleware to update updated_at
contactSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Instance method to set as primary contact
contactSchema.methods.setAsPrimary = async function() {
  this.is_primary_contact = true;
  return this.save();
};

// Instance method to remove primary status
contactSchema.methods.removePrimaryStatus = function() {
  this.is_primary_contact = false;
  return this.save();
};

// Check if model is already compiled
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

export default Contact;
