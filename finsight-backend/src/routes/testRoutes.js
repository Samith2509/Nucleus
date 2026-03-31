const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');
const Event = require('../models/Event'); // Demonstrating with the Event model

// POST /test/tenant - Create data securely restricted to the tenant
router.post('/tenant', protect, tenantMiddleware, async (req, res) => {
  try {
    // 1. When creating tenant-related data, always use req.tenantId
    const newEvent = new Event({
      tenantId: req.tenantId, // Safely assigned from the middleware, impossible to spoof
      userId: req.user.userId,
      feature: req.body.feature || 'TEST_FEATURE',
      channel: req.body.channel || 'API',
      eventType: req.body.eventType || 'SYSTEM_TEST'
    });

    const savedEvent = await newEvent.save();

    res.status(201).json({
      message: 'Created event successfully bound to your tenantId',
      data: savedEvent
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /test/tenant - Read data securely restricted to the tenant
router.get('/tenant', protect, tenantMiddleware, async (req, res) => {
  try {
    // 2. Prevent access to other tenant data
    // By strictly adding `{ tenantId: req.tenantId }` to the query, 
    // it's impossible to fetch data belonging to another tenant
    const events = await Event.find({ tenantId: req.tenantId }).sort({ timestamp: -1 });

    res.status(200).json({
      message: 'Successfully isolated and fetched your tenant properties',
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Protected GET /test/admin - Strictly isolated to ADMIN roles
router.get('/admin', protect, requireRole(['ADMIN']), (req, res) => {
  res.status(200).json({
    message: 'Welcome Admin! You have successfully passed the role middleware.',
    user: req.user
  });
});

module.exports = router;
