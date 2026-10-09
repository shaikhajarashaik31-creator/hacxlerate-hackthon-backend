const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Public verification
router.get('/verify/:code', coursesController.getCertificateByCode);
router.get('/certificate/:code', coursesController.getCertificateByCode);

// Authenticated course lists and details
router.get('/', authMiddleware, coursesController.getAllCourses);
router.get('/certificates', authMiddleware, coursesController.getStudentCertificates);
router.get('/:id', authMiddleware, coursesController.getCourseById);
router.get('/:id/lessons', authMiddleware, coursesController.getCourseLessons);

// Student only operations
router.post('/:id/enroll', authMiddleware, roleGuard(['student']), coursesController.enroll);
router.post('/:id/progress', authMiddleware, roleGuard(['student']), coursesController.updateProgress);
router.post('/:id/lessons/:lessonId/complete', authMiddleware, roleGuard(['student']), coursesController.completeLesson);
router.post('/:id/quiz/submit', authMiddleware, roleGuard(['student']), coursesController.submitQuiz);

module.exports = router;
