const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// All admin routes require admin role
router.use(authMiddleware);
router.use(roleGuard(['admin']));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.post('/users/:id/reset-password', adminController.resetPassword);
router.get('/student-progress', adminController.getStudentProgress);
router.get('/teacher-activity', adminController.getTeacherActivity);
router.get('/timeline', adminController.getTimeline);
router.get('/economy', adminController.getEconomy);

module.exports = router;
