import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    url: {
      type: String,
      default: null
    },
    filename: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    }
  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }],
  website: {
    type: String,
    default: null
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organisation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  },
  tags: [{
    type: String
  }],
  description: {
    type: String,
    maxlength: 2000
  },
  description_source: {
    type: String,
    maxlength: 200
  },
  company_size: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect', 'former'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  communication_preferences: {
    preferred_method: {
      type: String,
      enum: ['email', 'phone', 'in_person', 'video_call'],
      default: 'email'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    business_hours: {
      start: String,
      end: String
    }
  },
  billing_info: {
    billing_address: String,
    payment_terms: String,
    currency: {
      type: String,
      default: 'USD'
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
clientSchema.index({ name: 1 });
clientSchema.index({ organisation: 1 });
clientSchema.index({ owner: 1 });
clientSchema.index({ industry: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ is_active: 1 });

// Static method to find active clients
clientSchema.statics.findActive = function() {
  return this.find({ is_active: true });
};

// Virtual for contact count
clientSchema.virtual('contactCount').get(function() {
  return this.contacts ? this.contacts.length : 0;
});

// Virtual for key persons
clientSchema.virtual('keyPersons', {
  ref: 'KeyPerson',
  localField: '_id',
  foreignField: 'client',
  match: { is_active: true }
});

// Virtual for primary key person
clientSchema.virtual('primaryKeyPerson', {
  ref: 'KeyPerson',
  localField: '_id',
  foreignField: 'client',
  justOne: true,
  match: { is_active: true, is_primary: true }
});

// Pre-save middleware to update updated_at
clientSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Instance method to add contact
clientSchema.methods.addContact = function(contactId) {
  if (!this.contacts.includes(contactId)) {
    this.contacts.push(contactId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove contact
clientSchema.methods.removeContact = function(contactId) {
  this.contacts = this.contacts.filter(id => !id.equals(contactId));
  return this.save();
};

// Instance method to get key persons
clientSchema.methods.getKeyPersons = function() {
  const KeyPerson = mongoose.model('KeyPerson');
  return KeyPerson.findByClient(this._id);
};

// Instance method to get primary key person
clientSchema.methods.getPrimaryKeyPerson = function() {
  const KeyPerson = mongoose.model('KeyPerson');
  return KeyPerson.findPrimaryForClient(this._id);
};

// Check if model is already compiled
const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

export default Client;
