const express = require('express');
const router = express.Router();
const { getFeatureUsage, getFunnelAnalytics, getDashboardSummary, getFeatureAnalyticsTable, getFeatureDetail } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Apply the authMiddleware (protect) and requireRole to ensure proper access
router.get('/feature-usage', protect, requireRole(['ADMIN', 'ANALYST']), getFeatureUsage);
router.get('/funnel', protect, requireRole(['ADMIN', 'ANALYST']), getFunnelAnalytics);
router.get('/dashboard', protect, requireRole(['ADMIN', 'ANALYST']), getDashboardSummary);
router.get('/feature-analytics', protect, requireRole(['ADMIN', 'ANALYST']), getFeatureAnalyticsTable);
router.get('/feature-detail', protect, requireRole(['ADMIN', 'ANALYST']), getFeatureDetail);

module.exports = router;
