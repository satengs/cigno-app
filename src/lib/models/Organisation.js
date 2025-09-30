import mongoose from 'mongoose';

const organisationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String, // URL or file path
    default: null
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  website: {
    type: String,
    default: null
  },
  locations: [{
    type: String
  }],
  industry: {
    type: String,
    enum: [
      'Technology',
      'Healthcare',
      'Finance',
      'Education',
      'Manufacturing',
      'Retail',
      'Consulting',
      'Marketing',
      'Real Estate',
      'Other'
    ],
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String
  }],
  billing_info: {
    company_name: {
      type: String,
      trim: true
    },
    billing_address: {
      street: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    },
    tax_id: {
      type: String,
      trim: true
    },
    vat_number: {
      type: String,
      trim: true
    },
    payment_terms: {
      type: String,
      enum: ['net_15', 'net_30', 'net_45', 'net_60', 'due_on_receipt', 'custom'],
      default: 'net_30'
    },
    custom_payment_terms: String,
    currency: {
      type: String,
      default: 'USD'
    },
    billing_contact: {
      name: String,
      email: String,
      phone: String
    },
    invoice_email: String,
    billing_notes: String
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
organisationSchema.index({ name: 1 });
organisationSchema.index({ industry: 1 });
organisationSchema.index({ is_active: 1 });
organisationSchema.index({ admin: 1 });

// Static method to find active organisations
organisationSchema.statics.findActive = function() {
  return this.find({ is_active: true });
};

// Pre-save middleware to update updated_at
organisationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Check if model is already compiled
const Organisation = mongoose.models.Organisation || mongoose.model('Organisation', organisationSchema);

export default Organisation;
