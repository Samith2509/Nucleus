const express = require('express');
const router = express.Router();
const { createFeature, getFeatures, updateFeature, deleteFeature } = require('../controllers/featureController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// POST / -> createFeature (Only ADMIN)
router.post('/', protect, requireRole(['ADMIN']), createFeature);

// GET / -> getFeatures (Read-only access for ADMIN, ANALYST, VIEWER)
router.get('/', protect, requireRole(['ADMIN', 'ANALYST', 'VIEWER']), getFeatures);

// PUT /:id -> updateFeature (Only ADMIN)
router.put('/:id', protect, requireRole(['ADMIN']), updateFeature);

// DELETE /:id -> deleteFeature (Only ADMIN)
router.delete('/:id', protect, requireRole(['ADMIN']), deleteFeature);

module.exports = router;
