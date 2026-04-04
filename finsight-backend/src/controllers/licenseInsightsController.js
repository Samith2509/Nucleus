const mongoose = require('mongoose');
const Feature = require('../models/Feature');
const Event = require('../models/Event');
const User = require('../models/User');

exports.getLicenseInsights = async (req, res) => {
  try {
    const { tenantId } = req.user;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is missing from user context' });
    }

    const tenantObjId = new mongoose.Types.ObjectId(tenantId);

    // 1. Get all registered features
    const allFeatures = await Feature.find({}).lean();
    if (!allFeatures.length) {
      return res.status(200).json({
        success: true,
        data: {
          totalFeatures: 0, usedCount: 0, unusedCount: 0, utilizationRate: 0,
          unusedFeatures: [], underutilizedFeatures: [], wellUtilizedFeatures: []
        }
      });
    }

    const totalRegisteredUsers = await User.countDocuments({ tenantId: tenantObjId });
    const featureCodes = allFeatures.map(f => f.code);

    // 2. Aggregate usage per feature for this tenant
    const usageStats = await Event.aggregate([
      { $match: { tenantId: tenantObjId, feature: { $in: featureCodes } } },
      {
        $group: {
          _id: '$feature',
          usageCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          lastSeen: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          feature: '$_id',
          usageCount: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          lastSeen: 1
        }
      }
    ]);

    const usageMap = {};
    usageStats.forEach(s => { usageMap[s.feature] = s; });

    // 3. Classify each feature
    const unusedFeatures = [];
    const underutilizedFeatures = [];
    const wellUtilizedFeatures = [];

    allFeatures.forEach(f => {
      const stat = usageMap[f.code];
      const usageCount = stat ? stat.usageCount : 0;
      const uniqueUsers = stat ? stat.uniqueUsers : 0;
      const lastSeen = stat ? stat.lastSeen : null;
      const adoptionPct = totalRegisteredUsers > 0
        ? parseFloat(((uniqueUsers / totalRegisteredUsers) * 100).toFixed(1))
        : 0;

      const featureObj = {
        name: f.name,
        code: f.code,
        module: f.module || '',
        usageCount,
        uniqueUsers,
        adoptionPct,
        lastSeen,
        isActive: f.isActive !== false
      };

      if (usageCount === 0) {
        unusedFeatures.push({ ...featureObj, recommendation: 'Consider removing or promoting' });
      } else if (adoptionPct < 50) {
        underutilizedFeatures.push({ ...featureObj, recommendation: 'Create training materials' });
      } else {
        wellUtilizedFeatures.push(featureObj);
      }
    });

    const usedCount = allFeatures.length - unusedFeatures.length;
    const utilizationRate = allFeatures.length > 0
      ? parseFloat(((usedCount / allFeatures.length) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalFeatures: allFeatures.length,
        usedCount,
        unusedCount: unusedFeatures.length,
        underutilizedCount: underutilizedFeatures.length,
        utilizationRate,
        unusedFeatures,
        underutilizedFeatures,
        wellUtilizedFeatures
      }
    });

  } catch (error) {
    console.error('Error fetching license insights:', error);
    return res.status(500).json({ success: false, message: 'Server Error: unable to fetch license insights' });
  }
};
