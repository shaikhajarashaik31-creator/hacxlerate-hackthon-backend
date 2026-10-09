const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/problems', practiceController.getProblems);
router.get('/problems/:id', practiceController.getProblemById);
router.post('/problems/:id/run', practiceController.runSample);
router.post('/problems/:id/submit', practiceController.submitProblem);
router.get('/problems/:id/hint', practiceController.getHint);
router.get('/problems/:id/explain', practiceController.explainSolution);
router.post('/problems/:id/explain', practiceController.explainSolution);
router.get('/stats', practiceController.getStats);

module.exports = router;
