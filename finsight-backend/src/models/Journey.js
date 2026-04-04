const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Onboarding', 'Conversion', 'Retention', 'Other'],
    default: 'Onboarding'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Journey = mongoose.model('Journey', journeySchema);

module.exports = Journey;
