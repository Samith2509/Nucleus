const express = require('express');
const router = express.Router();
const { trackEvent, trackBatchEvents, getEvents, getEventFilters } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// POST /events -> trackEvent
// Assuming this router is mounted at /events in the main app
router.post('/', protect, trackEvent);

// GET /events/filters -> getEventFilters
router.get('/filters', protect, getEventFilters);

// GET /events -> getEvents
router.get('/', protect, getEvents);

// POST /events/batch -> trackBatchEvents
router.post('/batch', protect, trackBatchEvents);

module.exports = router;
