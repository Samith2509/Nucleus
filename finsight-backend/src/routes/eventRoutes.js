const express = require('express');
const router = express.Router();
const { trackEvent, trackBatchEvents } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// POST /events -> trackEvent
// Assuming this router is mounted at /events in the main app
router.post('/', protect, trackEvent);

// POST /events/batch -> trackBatchEvents
router.post('/batch', protect, trackBatchEvents);

module.exports = router;
