const express = require('express');
const router = express.Router();
const { getFeatureUsage, getFunnelAnalytics, getDashboardSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Apply the authMiddleware (protect) to ensure req.user exists
router.get('/feature-usage', protect, getFeatureUsage);
router.get('/funnel', protect, getFunnelAnalytics);
router.get('/dashboard', protect, getDashboardSummary);

module.exports = router;
