const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String
  },
  channel: {
    type: String,
    enum: ['WEB', 'MOBILE', 'API', 'BATCH']
  },
  feature: {
    type: String,
    required: true
  },
  eventType: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
});

// Create a compound index on tenantId and timestamp to optimize common queries
eventSchema.index({ tenantId: 1, timestamp: -1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
