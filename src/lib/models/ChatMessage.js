import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  // Message identification
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Chat context identification
  threadId: {
    type: String,
    required: true,
    index: true
  },
  
  projectId: {
    type: String,
    required: true,
    index: true
  },
  
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Message content
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system'],
    index: true
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 10000 // Reasonable limit for chat messages
  },
  
  // Message metadata
  type: {
    type: String,
    default: 'text',
    enum: ['text', 'error', 'system_info']
  },
  
  // AI response metadata (for assistant messages)
  aiProvider: {
    type: String,
    default: null // 'openai', 'backend', 'mock', etc.
  },
  
  responseTime: {
    type: Number,
    default: null // Time in milliseconds to generate response
  },
  
  // Context metadata
  contextData: {
    projectName: String,
    deliverableId: String,
    storylineId: String,
    sessionId: String
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for efficient queries
chatMessageSchema.index({ projectId: 1, userId: 1, timestamp: -1 });
chatMessageSchema.index({ threadId: 1, timestamp: 1 });
chatMessageSchema.index({ projectId: 1, role: 1, timestamp: -1 });
chatMessageSchema.index({ userId: 1, timestamp: -1 });

// Middleware to update updatedAt on save
chatMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods for common operations
chatMessageSchema.statics.getProjectMessages = function(projectId, userId, limit = 100) {
  return this.find({ projectId, userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

chatMessageSchema.statics.getThreadMessages = function(threadId, limit = 100) {
  return this.find({ threadId })
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();
};

chatMessageSchema.statics.createMessage = function(messageData) {
  const message = new this({
    messageId: messageData.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    threadId: messageData.threadId,
    projectId: messageData.projectId,
    userId: messageData.userId,
    role: messageData.role,
    content: messageData.content,
    type: messageData.type || 'text',
    aiProvider: messageData.aiProvider || null,
    responseTime: messageData.responseTime || null,
    contextData: messageData.contextData || {},
    timestamp: messageData.timestamp || new Date()
  });
  
  return message.save();
};

chatMessageSchema.statics.deleteProjectMessages = function(projectId, userId) {
  return this.deleteMany({ projectId, userId });
};

chatMessageSchema.statics.getMessageStats = function(projectId, userId) {
  return this.aggregate([
    { $match: { projectId, userId } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        lastMessage: { $max: '$timestamp' }
      }
    }
  ]);
};

const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;