import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  icon: {
    type: String,
    default: null
  },
  type: {
    type: String,
    required: true,
    enum: ['item', 'section', 'client', 'project', 'deliverable'],
    default: 'item'
  },
  status: {
    type: String,
    enum: [
      // Generic statuses
      'active', 'inactive', 'not-started', 'completed', 'in-progress',
      // Client-specific statuses
      'prospect', 'former',
      // Project-specific statuses
      'cancelled', 'on-hold',
      // Deliverable-specific statuses
      'draft', 'in_review', 'approved', 'delivered', 'rejected'
    ],
    default: 'active'
  },
  permissions: {
    canView: { type: Boolean, default: true },
    canAdd: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: true },
    canRemove: { type: Boolean, default: true },
    canCollapse: { type: Boolean, default: true }
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isCollapsed: {
    type: Boolean,
    default: false
  },
  isCollapsible: {
    type: Boolean,
    default: true
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Project-specific properties
  assignedClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    default: null
  },
  // Deliverable-specific properties
  brief: {
    type: String,
    default: '',
    trim: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  teamMembers: [{
    type: String,
    trim: true
  }],
  insights: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insight'
  }],
  materials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  storyline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Storyline',
    default: null
  }
}, {
  timestamps: true,
  collection: 'menu_items'
});

// Indexes for better query performance
MenuItemSchema.index({ type: 1 });
MenuItemSchema.index({ parentId: 1 });
MenuItemSchema.index({ status: 1 });
MenuItemSchema.index({ assignedClient: 1 });

// Virtual for getting children count
MenuItemSchema.virtual('childrenCount').get(function() {
  return this.children ? this.children.length : 0;
});

// Ensure virtual fields are serialized
MenuItemSchema.set('toJSON', { virtuals: true });
MenuItemSchema.set('toObject', { virtuals: true });

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
