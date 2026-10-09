const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/track', activityController.trackActivity);
router.get('/summary', activityController.getSummary);

module.exports = router;
