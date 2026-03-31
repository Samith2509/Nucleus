const mongoose = require('mongoose');
const Event = require('../models/Event');
const JourneyStep = require('../models/JourneyStep');

exports.getFeatureUsage = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is missing from user context',
      });
    }

    const matchStage = {
      tenantId: new mongoose.Types.ObjectId(tenantId)
    };

    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const featureUsage = await Event.aggregate([
      // Match events for the specific tenant
      {
        $match: matchStage
      },
      // First group: Feature AND Channel
      {
        $group: {
          _id: { feature: '$feature', channel: { $ifNull: ['$channel', 'UNKNOWN'] } },
          count: { $sum: 1 },
          userIds: { $addToSet: '$userId' }
        }
      },
      // Second group: Feature only, combining channels into an array and nesting users
      {
        $group: {
          _id: '$_id.feature',
          usageCount: { $sum: '$count' },
          channelsArray: { 
            $push: { k: '$_id.channel', v: '$count' } 
          },
          allUserIdsSets: { $push: '$userIds' }
        }
      },
      // Project the final structure
      {
        $project: {
          _id: 0,                   // Exclude the default _id field
          feature: '$_id',          // The aggregated feature name
          usageCount: 1,            // Include the total event count
          channelBreakdown: { $arrayToObject: '$channelsArray' }, // Map [{k:"WEB", v:5}] to { WEB: 5 }
          uniqueUsers: { 
            // Join all subsets of user arrays natively, then find size
            $size: {
              $reduce: {
                input: '$allUserIdsSets',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this'] }
              }
            } 
          }
        }
      },
      // Optional: Sort by usage count descending
      {
        $sort: { usageCount: -1 }
      }
    ]);

    return res.status(200).json({
        success: true,
        data: featureUsage
    });

  } catch (error) {
    console.error('Error fetching feature usage:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: unable to fetch analytics'
    });
  }
};

exports.getFunnelAnalytics = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { journeyId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is missing from user context',
      });
    }

    if (!journeyId) {
      return res.status(400).json({
        success: false,
        message: 'journeyId parameter is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(journeyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journeyId format. Must be a valid 24-character MongoDB ObjectId.',
      });
    }

    // 1. Fetch the steps in order
    const steps = await JourneyStep.find({ 
      journeyId: new mongoose.Types.ObjectId(journeyId) 
    }).sort({ stepOrder: 1 });
    
    if (!steps || steps.length === 0) {
      return res.status(404).json({ success: false, message: 'No steps found for this journey' });
    }

    const featureCodes = steps.map(s => s.featureCode);

    // 2. Perform aggregation to identify unique users per feature for this tenant
    const analytics = await Event.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          feature: { $in: featureCodes }
        }
      },
      {
        $group: {
          _id: '$feature',
          uniqueUsersSet: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          feature: '$_id',
          userCount: { $size: '$uniqueUsersSet' }
        }
      }
    ]);

    // 3. Map aggregation results back to the ordered steps array
    const funnelSteps = steps.map(step => {
      const match = analytics.find(a => a.feature === step.featureCode);
      return {
        stepOrder: step.stepOrder,
        stepName: step.stepName,
        feature: step.featureCode,
        uniqueUsers: match ? match.userCount : 0
      };
    });

    return res.status(200).json({
      success: true,
      data: funnelSteps
    });

  } catch (error) {
    console.error('Error fetching funnel analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: unable to fetch funnel analytics'
    });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const { tenantId } = req.user;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is missing from user context',
      });
    }

    // Execute multiple analytical aggregations strictly parallel utilizing MongoDB facets
    const dashboardAggregation = await Event.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId)
        }
      },
      {
        $facet: {
          totalEvents: [
            { $count: 'count' }
          ],
          activeUsers: [
            { $group: { _id: null, uniqueUsers: { $addToSet: '$userId' } } },
            { $project: { _id: 0, count: { $size: '$uniqueUsers' } } }
          ],
          topFeatures: [
            { $group: { _id: '$feature', usageCount: { $sum: 1 } } },
            { $sort: { usageCount: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, feature: '$_id', usageCount: 1 } }
          ]
        }
      }
    ]);

    const resultPayload = dashboardAggregation[0];

    const summary = {
      totalEvents: resultPayload.totalEvents[0]?.count || 0,
      activeUsers: resultPayload.activeUsers[0]?.count || 0,
      topFeatures: resultPayload.topFeatures || []
    };

    return res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: unable to fetch dashboard summary'
    });
  }
};
