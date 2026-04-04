const express = require('express');
const router = express.Router();
const { 
  getGeneralSettings, updateGeneralSettings, 
  getDeploymentSettings, getTeamSettings, deleteTeamMember, 
  getNotificationSettings, updateNotificationSettings,
  getIntegrationSettings, updateIntegrationSettings
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/general', protect, getGeneralSettings);
router.put('/general', protect, requireRole(['ADMIN']), updateGeneralSettings);

router.get('/deployment', protect, getDeploymentSettings);

router.get('/team', protect, getTeamSettings);
router.delete('/team/:userId', protect, requireRole(['ADMIN']), deleteTeamMember);

router.get('/notifications', protect, getNotificationSettings);
router.put('/notifications', protect, requireRole(['ADMIN']), updateNotificationSettings);

router.get('/integrations', protect, getIntegrationSettings);
router.put('/integrations', protect, requireRole(['ADMIN']), updateIntegrationSettings);

module.exports = router;
