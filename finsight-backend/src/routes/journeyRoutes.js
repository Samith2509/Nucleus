const express = require('express');
const router = express.Router();
const { createJourney, addJourneyStep, getJourneySteps } = require('../controllers/journeyController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// POST / -> createJourney (Only ADMIN)
router.post('/', protect, requireRole(['ADMIN']), createJourney);

// POST /step -> addJourneyStep (Only ADMIN)
router.post('/step', protect, requireRole(['ADMIN']), addJourneyStep);

// GET /:journeyId/steps -> getJourneySteps (Read-only access)
router.get('/:journeyId/steps', protect, requireRole(['ADMIN', 'ANALYST', 'VIEWER']), getJourneySteps);

module.exports = router;
