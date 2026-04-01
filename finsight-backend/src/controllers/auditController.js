const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Return logs filtered by tenantId and sort by latest first
    const logs = await AuditLog.find({ tenantId }).sort({ timestamp: -1 });

    res.status(200).json({ success: true, message: 'Audit logs retrieved successfully', data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
