const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true
  },
  telemetryEnabled: { type: Boolean, default: true },
  anonymizeUserData: { type: Boolean, default: true },
  gdprComplianceMode: { type: Boolean, default: false },
  piiMasking: {
    email: { type: Boolean, default: true },
    phone: { type: Boolean, default: true },
    ip: { type: Boolean, default: false },
    fullName: { type: Boolean, default: false },
    physicalAddress: { type: Boolean, default: true }
  },
  dataRetention: {
    eventData: { type: String, default: '90 days' },
    aggregatedAnalytics: { type: String, default: '2 years' },
    auditLogs: { type: String, default: '7 years' }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Consent = mongoose.model('Consent', consentSchema);

module.exports = Consent;
