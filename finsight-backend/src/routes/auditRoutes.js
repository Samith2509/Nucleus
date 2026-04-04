const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditFilters, getAuditKPIs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');

// GET /filters -> getAuditFilters
router.get('/filters', protect, getAuditFilters);

// GET /kpis -> getAuditKPIs
router.get('/kpis', protect, getAuditKPIs);

// GET / -> getAuditLogs
router.get('/', protect, getAuditLogs);

module.exports = router;
