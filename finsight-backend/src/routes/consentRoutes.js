const express = require('express');
const router = express.Router();
const { setConsent, getConsent } = require('../controllers/consentController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// POST / -> setConsent (Only ADMIN)
router.post('/', protect, requireRole(['ADMIN']), setConsent);

// GET / -> getConsent (Read-only access)
router.get('/', protect, requireRole(['ADMIN', 'ANALYST', 'VIEWER']), getConsent);

module.exports = router;
