const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');
const Event = require('../models/Event'); // Demonstrating with the Event model
const Journey = require('../models/Journey');
const JourneyStep = require('../models/JourneyStep');
const mongoose = require('mongoose');

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

// POST /test/seed-funnel - Auto-generates a sample journey and populates some dummy events
router.post('/seed-funnel', protect, tenantMiddleware, async (req, res) => {
  try {
    // 1. Create a mock Journey
    const journey = await Journey.create({
      tenantId: req.tenantId,
      name: 'Sample Onboarding Funnel'
    });

    // 2. Insert chronological Journey Steps
    await JourneyStep.insertMany([
      { journeyId: journey._id, stepOrder: 1, stepName: 'Visited Landing Page', featureCode: 'LANDING_VIEW' },
      { journeyId: journey._id, stepOrder: 2, stepName: 'Clicked Sign Up', featureCode: 'SIGNUP_CLICK' },
      { journeyId: journey._id, stepOrder: 3, stepName: 'Completed Registration', featureCode: 'REGISTER_SUCCESS' }
    ]);

    // 3. Generate some dummy events to make the Funnel Analytics endpoint return real numbers
    const mockUserId1 = new mongoose.Types.ObjectId();
    const mockUserId2 = new mongoose.Types.ObjectId();

    await Event.insertMany([
      // mockUserId1 completes all 3 steps
      { tenantId: req.tenantId, userId: mockUserId1, feature: 'LANDING_VIEW', eventType: 'VIEW', timestamp: new Date() },
      { tenantId: req.tenantId, userId: mockUserId1, feature: 'SIGNUP_CLICK', eventType: 'CLICK', timestamp: new Date() },
      { tenantId: req.tenantId, userId: mockUserId1, feature: 'REGISTER_SUCCESS', eventType: 'SUBMIT', timestamp: new Date() },
      // mockUserId2 completes only 2 steps (bounces)
      { tenantId: req.tenantId, userId: mockUserId2, feature: 'LANDING_VIEW', eventType: 'VIEW', timestamp: new Date() },
      { tenantId: req.tenantId, userId: mockUserId2, feature: 'SIGNUP_CLICK', eventType: 'CLICK', timestamp: new Date() },
      // random user bounces instantly
      { tenantId: req.tenantId, userId: new mongoose.Types.ObjectId(), feature: 'LANDING_VIEW', eventType: 'VIEW', timestamp: new Date() }
    ]);

    res.status(201).json({
      message: 'Successfully generated a test Journey, Journey Steps, and Events! Copy the journeyId provided below into your Funnel Analytics GET request to see it in action.',
      journeyId: journey._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding funnel data', error: error.message });
  }
});

module.exports = router;
