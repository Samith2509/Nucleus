const Feature = require('../models/Feature');
const AuditLog = require('../models/AuditLog');

exports.createFeature = async (req, res) => {
  try {
    const { name, code, module, description } = req.body;
    
    // Convert code to uppercase
    const upperCode = code ? code.toUpperCase() : undefined;

    const newFeature = new Feature({
      name,
      code: upperCode,
      module,
      description
    });

    const savedFeature = await newFeature.save();

    await AuditLog.create({
      tenantId: req.user.tenantId,
      action: 'CREATE_FEATURE',
      performedBy: req.user.userId
    });

    res.status(201).json({ success: true, message: 'Feature created successfully', data: savedFeature });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getFeatures = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };
    const features = await Feature.find(query).lean();

    const Event = require('../models/Event');
    const featuresWithUsage = await Promise.all(features.map(async f => {
      const usage = await Event.countDocuments({ feature: f.code });
      return { ...f, usage };
    }));

    res.status(200).json({ success: true, message: 'Features retrieved successfully', data: featuresWithUsage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, name, code, module, description } = req.body;
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (code) updateData.code = code.toUpperCase();
    if (module) updateData.module = module;
    if (description !== undefined) updateData.description = description;

    const feature = await Feature.findByIdAndUpdate(id, updateData, { new: true });
    if (!feature) {
      return res.status(404).json({ success: false, message: 'Feature not found' });
    }

    await AuditLog.create({
      tenantId: req.user.tenantId,
      action: 'UPDATE_FEATURE',
      performedBy: req.user.userId
    });

    res.status(200).json({ success: true, message: 'Feature updated', data: feature });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const feature = await Feature.findByIdAndDelete(id);
    if (!feature) {
      return res.status(404).json({ success: false, message: 'Feature not found' });
    }

    await AuditLog.create({
      tenantId: req.user.tenantId,
      action: 'DELETE_FEATURE',
      performedBy: req.user.userId
    });

    res.status(200).json({ success: true, message: 'Feature deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
