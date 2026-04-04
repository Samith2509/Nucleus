const express = require('express');
const router = express.Router();
const { getFeatureUsage, getFunnelAnalytics, getDashboardSummary, getFeatureAnalyticsTable, getFeatureDetail } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const { getCustomerAnalytics, getCustomerDetail } = require('../controllers/customerAnalyticsController');
const { getLicenseInsights } = require('../controllers/licenseInsightsController');

// Apply the authMiddleware (protect) and requireRole to ensure proper access
router.get('/feature-usage', protect, requireRole(['ADMIN', 'ANALYST']), getFeatureUsage);
router.get('/funnel', protect, requireRole(['ADMIN', 'ANALYST']), getFunnelAnalytics);
router.get('/dashboard', protect, requireRole(['ADMIN', 'ANALYST']), getDashboardSummary);
router.get('/feature-analytics', protect, requireRole(['ADMIN', 'ANALYST']), getFeatureAnalyticsTable);
router.get('/feature-detail', protect, requireRole(['ADMIN', 'ANALYST']), getFeatureDetail);

// Customers/Segments routes
router.get('/customers', protect, requireRole(['ADMIN', 'ANALYST']), getCustomerAnalytics);
router.get('/customers/:tenantId', protect, requireRole(['ADMIN', 'ANALYST']), getCustomerDetail);

// License Insights route
router.get('/license-insights', protect, requireRole(['ADMIN', 'ANALYST']), getLicenseInsights);

// Predictions & Insights route
const { getPredictions } = require('../controllers/predictionsController');
router.get('/predictions', protect, requireRole(['ADMIN', 'ANALYST']), getPredictions);

module.exports = router;
