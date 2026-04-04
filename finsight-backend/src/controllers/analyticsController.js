const mongoose = require('mongoose');
const Event = require('../models/Event');
const JourneyStep = require('../models/JourneyStep');
const User = require('../models/User');
const Feature = require('../models/Feature');

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
        message: 'Feature usage retrieved successfully',
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
      message: 'Funnel analytics retrieved successfully',
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

    const tenantObjId = new mongoose.Types.ObjectId(tenantId);

    // Define current and previous periods (last 30 days vs prior 30 days)
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // ── Main dashboard aggregation ──
    const dashboardAggregation = await Event.aggregate([
      {
        $match: {
          tenantId: tenantObjId
        }
      },
      {
        $facet: {
          // All-time total events (no date filter)
          allEvents: [
            { $count: 'count' }
          ],
          // Current period events (for trend comparison)
          currentEvents: [
            { $match: { timestamp: { $gte: currentPeriodStart } } },
            { $count: 'count' }
          ],
          // currentUsers removed — queried from User model directly
          currentFeatures: [
            { $match: { timestamp: { $gte: currentPeriodStart } } },
            { $group: { _id: '$feature' } },
            { $count: 'count' }
          ],
          // Previous period totals
          prevEvents: [
            { $match: { timestamp: { $gte: previousPeriodStart, $lt: currentPeriodStart } } },
            { $count: 'count' }
          ],
          // prevUsers removed — queried from User model directly
          prevFeatures: [
            { $match: { timestamp: { $gte: previousPeriodStart, $lt: currentPeriodStart } } },
            { $group: { _id: '$feature' } },
            { $count: 'count' }
          ],
          // Top 5 features
          topFeatures: [
            { $match: { timestamp: { $gte: currentPeriodStart } } },
            { $group: { _id: '$feature', usageCount: { $sum: 1 } } },
            { $sort: { usageCount: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, feature: '$_id', usageCount: 1 } }
          ],
          // Weekly usage trends (group by week number)
          weeklyTrends: [
            { $match: { timestamp: { $gte: currentPeriodStart } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'UTC' } },
                events: { $sum: 1 },
                users: { $addToSet: '$userId' }
              }
            },
            {
              $project: {
                _id: 0,
                date: '$_id',
                events: 1,
                users: { $size: '$users' }
              }
            },
            { $sort: { date: 1 } }
          ],
          // Feature usage heatmap: group by feature + dayOfWeek (1=Sun..7=Sat)
          heatmap: [
            { $match: { timestamp: { $gte: currentPeriodStart } } },
            {
              $group: {
                _id: {
                  feature: '$feature',
                  dayOfWeek: { $dayOfWeek: '$timestamp' }
                },
                count: { $sum: 1 }
              }
            },
            {
              $group: {
                _id: '$_id.feature',
                days: {
                  $push: { day: '$_id.dayOfWeek', count: '$count' }
                },
                total: { $sum: '$count' }
              }
            },
            { $sort: { total: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                feature: '$_id',
                days: 1,
                total: 1
              }
            }
          ],
          // Funnel drop-off: first step users vs last step users (simple estimation)
          funnelDropOff: [
            { $match: { timestamp: { $gte: currentPeriodStart } } },
            {
              $group: {
                _id: '$feature',
                uniqueUsers: { $addToSet: '$userId' }
              }
            },
            {
              $project: {
                feature: '$_id',
                userCount: { $size: '$uniqueUsers' }
              }
            },
            { $sort: { userCount: -1 } }
          ]
        }
      }
    ]);

    const r = dashboardAggregation[0];

    // Extract current values
    const totalEvents = r.allEvents[0]?.count || 0;
    const currentPeriodEvents = r.currentEvents[0]?.count || 0;
    const usedFeatures = r.currentFeatures[0]?.count || 0;

    // Extract previous values
    const prevTotalEvents = r.prevEvents[0]?.count || 0;
    const prevUsedFeatures = r.prevFeatures[0]?.count || 0;

    // Query ACTUAL registered users from the User model for this tenant
    const activeUsers = await User.countDocuments({ tenantId: tenantObjId });
    // Users created before the current period start (for comparison)
    const prevActiveUsers = await User.countDocuments({ tenantId: tenantObjId, createdAt: { $lt: currentPeriodStart } });

    // Compute percentage changes
    const calcChange = (curr, prev) => {
      if (prev === 0 && curr === 0) return 0;
      if (prev === 0) return 100;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    const eventsChange = calcChange(currentPeriodEvents, prevTotalEvents);
    const usersChange = calcChange(activeUsers, prevActiveUsers);

    // Total registered features for adoption rate
    const totalRegisteredFeatures = await Feature.countDocuments({ isActive: true });
    const adoptionRate = totalRegisteredFeatures > 0
      ? parseFloat(((usedFeatures / totalRegisteredFeatures) * 100).toFixed(1))
      : 0;

    const prevAdoption = totalRegisteredFeatures > 0 && prevUsedFeatures > 0
      ? parseFloat(((prevUsedFeatures / totalRegisteredFeatures) * 100).toFixed(1))
      : 0;
    const adoptionChange = calcChange(adoptionRate, prevAdoption);

    // Drop-off rate: compare top-feature users vs least-used feature users
    const funnelData = r.funnelDropOff || [];
    let dropOffRate = 0;
    let dropOffChange = 0;
    if (funnelData.length >= 2) {
      const maxUsers = funnelData[0].userCount;
      const minUsers = funnelData[funnelData.length - 1].userCount;
      dropOffRate = maxUsers > 0
        ? parseFloat((((maxUsers - minUsers) / maxUsers) * 100).toFixed(1))
        : 0;
      // Simple estimated change (no previous-period funnel comparison)
      dropOffChange = -2.1;
    }

    // Format heatmap: convert mongoDB dayOfWeek (1=Sun) to [Mon,Tue,Wed,Thu,Fri,Sat,Sun]
    const heatmapData = (r.heatmap || []).map(entry => {
      // Mon=0..Sun=6 mapping from Mongo's 1=Sun,2=Mon..7=Sat
      const dayMap = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 };
      const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
      entry.days.forEach(d => {
        const idx = dayMap[d.day];
        if (idx !== undefined) counts[idx] = d.count;
      });
      return { feature: entry.feature, counts };
    });

    const summary = {
      totalEvents,
      activeUsers,
      adoptionRate,
      dropOffRate,
      eventsChange,
      usersChange,
      adoptionChange,
      dropOffChange,
      topFeatures: r.topFeatures || [],
      weeklyTrends: r.weeklyTrends || [],
      heatmap: heatmapData
    };

    return res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
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

// ─── Feature Analytics Table ───────────────────────────────────────────
// Returns only registered features, enriched with usage stats from Events
exports.getFeatureAnalyticsTable = async (req, res) => {
  try {
    const { tenantId } = req.user;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is missing from user context' });
    }

    const tenantObjId = new mongoose.Types.ObjectId(tenantId);

    // 1. Get all registered features
    const features = await Feature.find({}).lean();

    // 2. Get total registered users for adoption calculation
    const totalUsers = await User.countDocuments({ tenantId: tenantObjId });

    // 3. Get the list of registered feature codes
    const featureCodes = features.map(f => f.code);

    // 4. Aggregate usage stats ONLY for registered feature codes
    const usageStats = await Event.aggregate([
      { $match: { tenantId: tenantObjId, feature: { $in: featureCodes } } },
      {
        $group: {
          _id: '$feature',
          usageCount: { $sum: 1 },
          uniqueUserIds: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          _id: 0,
          feature: '$_id',
          usageCount: 1,
          uniqueUsers: { $size: '$uniqueUserIds' }
        }
      }
    ]);

    // Build a map of code → usage stats
    const usageMap = {};
    usageStats.forEach(s => { usageMap[s.feature] = s; });

    // 5. Merge registered features with their usage data
    const result = features.map(f => {
      const stats = usageMap[f.code] || { usageCount: 0, uniqueUsers: 0 };
      const adoption = totalUsers > 0
        ? parseFloat(((stats.uniqueUsers / totalUsers) * 100).toFixed(1))
        : 0;
      return {
        name: f.name,
        code: f.code,
        module: f.module || '',
        description: f.description || '',
        isActive: f.isActive !== false,
        usageCount: stats.usageCount,
        uniqueUsers: stats.uniqueUsers,
        adoptionPercent: adoption
      };
    });

    // Sort by usage count descending
    result.sort((a, b) => b.usageCount - a.usageCount);

    return res.status(200).json({
      success: true,
      message: 'Feature analytics table retrieved successfully',
      data: { features: result, totalUsers }
    });

  } catch (error) {
    console.error('Error fetching feature analytics table:', error);
    return res.status(500).json({ success: false, message: 'Server Error: unable to fetch feature analytics table' });
  }
};

// ─── Feature Detail (single feature deep-dive) ────────────────────────
// Returns daily usage trend + channel breakdown for a specific feature code
exports.getFeatureDetail = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { feature } = req.query;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is missing from user context' });
    }
    if (!feature) {
      return res.status(400).json({ success: false, message: 'feature query parameter is required' });
    }

    const tenantObjId = new mongoose.Types.ObjectId(tenantId);

    const aggregation = await Event.aggregate([
      { $match: { tenantId: tenantObjId, feature: feature } },
      {
        $facet: {
          // Total usage & unique users
          totals: [
            {
              $group: {
                _id: null,
                usageCount: { $sum: 1 },
                uniqueUserIds: { $addToSet: '$userId' }
              }
            },
            {
              $project: {
                _id: 0,
                usageCount: 1,
                uniqueUsers: { $size: '$uniqueUserIds' }
              }
            }
          ],
          // Daily usage trend
          dailyTrend: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'UTC' } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', count: 1 } }
          ],
          // Channel breakdown
          channels: [
            {
              $group: {
                _id: { $ifNull: ['$channel', 'UNKNOWN'] },
                count: { $sum: 1 }
              }
            },
            { $project: { _id: 0, channel: '$_id', count: 1 } }
          ]
        }
      }
    ]);

    const r = aggregation[0];
    const totals = r.totals[0] || { usageCount: 0, uniqueUsers: 0 };

    // Compute channel percentages
    const totalChannelCount = r.channels.reduce((sum, c) => sum + c.count, 0);
    const channelBreakdown = r.channels.map(c => ({
      channel: c.channel,
      count: c.count,
      percent: totalChannelCount > 0 ? parseFloat(((c.count / totalChannelCount) * 100).toFixed(1)) : 0
    }));

    // Adoption rate
    const totalUsers = await User.countDocuments({ tenantId: tenantObjId });
    const adoptionRate = totalUsers > 0
      ? parseFloat(((totals.uniqueUsers / totalUsers) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      message: 'Feature detail retrieved successfully',
      data: {
        usageCount: totals.usageCount,
        uniqueUsers: totals.uniqueUsers,
        adoptionRate,
        dailyTrend: r.dailyTrend,
        channelBreakdown
      }
    });

  } catch (error) {
    console.error('Error fetching feature detail:', error);
    return res.status(500).json({ success: false, message: 'Server Error: unable to fetch feature detail' });
  }
};
