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
  },
  industry: { type: String, default: 'Technology' },
  timezone: { type: String, default: 'UTC' },
  website: { type: String, default: '' },
  notifications: {
    email: { type: Boolean, default: true },
    slack: { type: Boolean, default: false },
    highUsageAlerts: { type: Boolean, default: true },
    licenseThreshold: { type: Boolean, default: false },
    churnRisk: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: false }
  },
  integrations: {
    slackConnected: { type: Boolean, default: true },
    jiraConnected: { type: Boolean, default: false },
    datadogConnected: { type: Boolean, default: false }
  }
});

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
