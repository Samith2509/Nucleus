const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Feature = require('../models/Feature');
const Event = require('../models/Event');
const AuditLog = require('../models/AuditLog');

const logAction = async (tenantId, action, performedBy, metadata) => {
  try { await AuditLog.create({ tenantId, action, performedBy, metadata }); } catch (e) {}
};

exports.getGeneralSettings = async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      tenant = await Tenant.create({ _id: req.user.tenantId, name: 'Acme Corp', deploymentType: 'CLOUD' });
    }
    
    const featureCount = await Feature.countDocuments({ tenantId: req.user.tenantId });
    const userCount = await User.countDocuments({ tenantId: req.user.tenantId });
    const eventCount = await Event.countDocuments({ tenantId: req.user.tenantId });

    res.json({
      success: true,
      data: {
        id: tenant._id,
        name: tenant.name,
        industry: tenant.industry || 'Technology',
        timezone: tenant.timezone || 'UTC',
        website: tenant.website || '',
        plan: tenant.plan || 'Enterprise',
        usage: {
          features: featureCount,
          users: userCount,
          events: eventCount
        }
      }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateGeneralSettings = async (req, res) => {
  try {
    const { name, industry, timezone, website } = req.body;
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { $set: { name, industry, timezone, website } },
      { new: true, runValidators: true }
    );
    await logAction(req.user.tenantId, 'UPDATE_SETTINGS_GENERAL', req.user.id, { attributes: Object.keys(req.body) });
    res.json({ success: true, message: 'Settings updated', data: tenant });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getDeploymentSettings = async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      tenant = await Tenant.create({ _id: req.user.tenantId, name: 'Acme Corp', deploymentType: 'CLOUD' });
    }
    
    res.json({
      success: true,
      data: {
        deploymentType: tenant.deploymentType || 'CLOUD',
        region: tenant.region || 'US East (N. Virginia)',
        environment: 'Production',
        restApiUrl: 'https://api.finsight.io/v1',
        websocketUrl: 'wss://ws.finsight.io'
      }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getTeamSettings = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId }).select('-password -__v').sort({ createdAt: 1 });
    res.json({ success: true, data: users });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    await logAction(req.user.tenantId, 'DELETE_USER', req.user.id, { targetId: req.params.userId });
    res.json({ success: true, message: 'User removed' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getNotificationSettings = async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      tenant = await Tenant.create({ _id: req.user.tenantId, name: 'Acme Corp', deploymentType: 'CLOUD' });
    }
    
    res.json({ success: true, data: tenant.notifications || {} });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateNotificationSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { $set: { notifications: req.body } },
      { new: true }
    );
    await logAction(req.user.tenantId, 'UPDATE_SETTINGS_NOTIFICATIONS', req.user.id, Object.keys(req.body));
    res.json({ success: true, data: tenant.notifications });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getIntegrationSettings = async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      tenant = await Tenant.create({ _id: req.user.tenantId, name: 'Acme Corp', deploymentType: 'CLOUD' });
    }
    
    res.json({ success: true, data: tenant.integrations || {} });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateIntegrationSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { $set: { integrations: req.body } },
      { new: true }
    );
    await logAction(req.user.tenantId, 'UPDATE_SETTINGS_INTEGRATIONS', req.user.id, req.body);
    res.json({ success: true, data: tenant.integrations });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
