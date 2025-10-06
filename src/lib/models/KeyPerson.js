import mongoose from 'mongoose';

const keyPersonSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  image: {
    type: String,
    trim: true,
    default: null // URL to profile image
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  is_primary: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
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

// Indexes for better query performance
keyPersonSchema.index({ client: 1 });
keyPersonSchema.index({ email: 1 });
keyPersonSchema.index({ is_active: 1 });
keyPersonSchema.index({ is_primary: 1 });

// Only add methods and virtuals if schema isn't already compiled
if (!mongoose.models.KeyPerson) {
  // Ensure only one primary contact per client
  keyPersonSchema.pre('save', async function(next) {
    this.updated_at = new Date();
    
    if (this.is_primary && this.isModified('is_primary')) {
      // Remove primary status from other contacts for this client
      await mongoose.model('KeyPerson').updateMany(
        { 
          client: this.client, 
          _id: { $ne: this._id },
          is_primary: true 
        },
        { is_primary: false }
      );
    }
    
    next();
  });

  // Virtual for display name
  keyPersonSchema.virtual('display_name').get(function() {
    return `${this.full_name} (${this.role})`;
  });

  // Static method to find primary contact for client
  keyPersonSchema.statics.findPrimaryForClient = function(clientId) {
    return this.findOne({ client: clientId, is_primary: true, is_active: true });
  };

  // Static method to find all contacts for client
  keyPersonSchema.statics.findByClient = function(clientId) {
    return this.find({ client: clientId, is_active: true }).sort({ is_primary: -1, full_name: 1 });
  };

  // Instance method to set as primary
  keyPersonSchema.methods.setPrimary = async function() {
    // Remove primary status from other contacts for this client
    await mongoose.model('KeyPerson').updateMany(
      { 
        client: this.client, 
        _id: { $ne: this._id },
        is_primary: true 
      },
      { is_primary: false }
    );
    
    this.is_primary = true;
    return this.save();
  };
}

// Check if model is already compiled
const KeyPerson = mongoose.models.KeyPerson || mongoose.model('KeyPerson', keyPersonSchema);

export default KeyPerson;