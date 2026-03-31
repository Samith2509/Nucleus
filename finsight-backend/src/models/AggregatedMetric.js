const mongoose = require('mongoose');

const aggregatedMetricSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  feature: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  uniqueUsers: {
    type: Number,
    default: 0
  }
});

// Create a compound index on tenantId, feature, and date
aggregatedMetricSchema.index({ tenantId: 1, feature: 1, date: -1 });

const AggregatedMetric = mongoose.model('AggregatedMetric', aggregatedMetricSchema);

module.exports = AggregatedMetric;
