const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const testRoutes = require('./testRoutes');
const eventRoutes = require('./eventRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const featureRoutes = require('./featureRoutes');
const journeyRoutes = require('./journeyRoutes');
const consentRoutes = require('./consentRoutes');
const auditRoutes = require('./auditRoutes');

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Auth routes
router.use('/auth', authRoutes);

// Event routes
router.use('/events', eventRoutes);

// Test routes
router.use('/test', testRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Feature routes
router.use('/features', featureRoutes);

// Journey routes
router.use('/journeys', journeyRoutes);

// Consent routes
router.use('/consent', consentRoutes);

// Audit routes
router.use('/audit', auditRoutes);

// Settings routes
const settingsRoutes = require('./settingsRoutes');
router.use('/settings', settingsRoutes);

module.exports = router;
