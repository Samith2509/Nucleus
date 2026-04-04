const Consent = require('../models/Consent');
const AuditLog = require('../models/AuditLog');

exports.setConsent = async (req, res) => {
  try {
    const { telemetryEnabled, anonymizeUserData, gdprComplianceMode, piiMasking, dataRetention } = req.body;
    const tenantId = req.user.tenantId;

    // Upsert (create or update) consent for tenant
    const consent = await Consent.findOneAndUpdate(
      { tenantId },
      { 
        $set: {
          telemetryEnabled,
          anonymizeUserData,
          gdprComplianceMode,
          ...(piiMasking && { piiMasking }),
          ...(dataRetention && { dataRetention }),
          updatedAt: Date.now()
        }
      },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      tenantId,
      action: 'SET_CONSENT',
      performedBy: req.user.userId
    });

    res.status(200).json({ success: true, message: 'Consent configured successfully', data: consent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getConsent = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const consent = await Consent.findOne({ tenantId });
    
    if (!consent) {
      // Return a default structure if the tenant doesn't have a consent record yet
      return res.status(200).json({
        success: true,
        message: 'Default consent retrieved successfully',
        data: {
          tenantId,
          telemetryEnabled: true,
          anonymizeUserData: true,
          gdprComplianceMode: false,
          piiMasking: { email: true, phone: true, ip: false, fullName: false, physicalAddress: true },
          dataRetention: { eventData: '90 days', aggregatedAnalytics: '2 years', auditLogs: '7 years' }
        }
      });
    }

    res.status(200).json({ success: true, message: 'Consent retrieved successfully', data: consent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
