const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// All teacher routes require teacher role
router.use(authMiddleware);
router.use(roleGuard(['teacher']));

router.get('/dashboard', teacherController.getDashboard);
router.get('/students', teacherController.getMyStudents);
router.get('/student-logins', teacherController.getStudentLogins);
router.get('/feedback-summary', teacherController.getFeedbackSummary);
router.get('/analytics', teacherController.getAnalytics);
router.post('/attendance', teacherController.markAttendance);

module.exports = router;
