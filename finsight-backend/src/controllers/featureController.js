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
    // Return all active features
    const features = await Feature.find({ isActive: true });
    res.status(200).json({ success: true, message: 'Features retrieved successfully', data: features });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
