const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  deploymentType: {
    type: String,
    required: true,
    enum: ['CLOUD', 'ON_PREM']
  },
  region: {
    type: String
  },
  plan: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
