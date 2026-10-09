const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Streaming AI Mentor & Sessions
router.post('/chat/stream', aiController.streamChat);
router.post('/stream', aiController.streamChat);
router.get('/sessions', aiController.getSessions);
router.post('/sessions', aiController.createSession);
router.put('/sessions/:id', aiController.renameSession);
router.delete('/sessions/:id', aiController.deleteSession);
router.get('/sessions/:id/messages', aiController.getSessionMessages);
router.delete('/chat-history', aiController.clearChatHistory);

// Resume & ATS Optimization
router.post('/resume', aiController.generateResume);
router.get('/resume', aiController.getSavedResume);
router.post('/resume/improve', aiController.improveResume);
router.post('/ats-score', aiController.calculateAtsScore);

// Mock Interview
router.post('/interview/question', aiController.interviewQuestion);
router.post('/interview/evaluate', aiController.evaluateInterview);

// Multi-Page Missed Notes Synthesis
router.post('/missed-notes', aiController.synthesizeMissedNotes);

module.exports = router;
