const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// All student routes require auth and student role
router.use(authMiddleware);
router.use(roleGuard(['student']));

router.get('/dashboard', studentController.getDashboard);
router.get('/attendance', studentController.getAttendance);
router.get('/faculty-feedback', studentController.getFacultyFeedback);
router.post('/faculty-feedback', studentController.submitFacultyFeedback);
router.get('/logins', studentController.getLogins);
router.get('/notes', studentController.getNotes);
router.post('/notes/request', studentController.requestNotes);
router.post('/notes/toggle-revised', studentController.toggleRevised);
router.patch('/notes/revise', studentController.toggleRevised);
router.get('/coins', studentController.getCoins);
router.get('/trend', studentController.getTrend);
router.get('/risk-status', studentController.getRiskStatus);

module.exports = router;
