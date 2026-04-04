const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { actionType, userId, dateRange } = req.query;

    const query = { tenantId };
    if (actionType) query.action = actionType;
    if (userId) query.performedBy = userId;
    
    if (dateRange) {
      const now = new Date();
      let startDate;
      if (dateRange === 'Today') {
        startDate = new Date(now.setHours(0,0,0,0));
      } else if (dateRange === 'Last 7 days') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'Last 30 days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (startDate) {
        query.timestamp = { $gte: startDate };
      }
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100); // limit for performance

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditFilters = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const actions = await AuditLog.distinct('action', { tenantId });
    
    // To get distinct users, we can find all unique performedBy
    const userIds = await AuditLog.distinct('performedBy', { tenantId });
    const User = require('../models/User');
    const users = await User.find({ _id: { $in: userIds } }, 'name email');

    res.status(200).json({ success: true, data: { actions, users } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditKPIs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const today = new Date();
    today.setHours(0,0,0,0);

    const todayActions = await AuditLog.countDocuments({ tenantId, timestamp: { $gte: today } });
    
    const configChanges = await AuditLog.countDocuments({ 
      tenantId, 
      timestamp: { $gte: today },
      action: { $regex: /FEATURE|JOURNEY|CONFIG|COMPLIANCE/i } 
    });

    const activeUsersList = await AuditLog.distinct('performedBy', { tenantId, timestamp: { $gte: today } });
    const activeUsers = activeUsersList.length;

    const criticalEvents = await AuditLog.countDocuments({ 
      tenantId, 
      timestamp: { $gte: today },
      action: { $regex: /DELETE|FAIL|ERROR|CRITICAL/i } 
    });

    res.status(200).json({ 
      success: true, 
      data: {
        todayActions,
        configChanges,
        activeUsers,
        criticalEvents
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
