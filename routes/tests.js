const express = require('express');
const router = express.Router();
const testsController = require('../controllers/testsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', testsController.getAllTests);
router.get('/:id', testsController.getTestById);
router.post('/:id/submit', testsController.submitTest);

module.exports = router;
