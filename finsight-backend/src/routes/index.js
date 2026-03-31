const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const testRoutes = require('./testRoutes');
const eventRoutes = require('./eventRoutes');

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

module.exports = router;
