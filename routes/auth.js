const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Login rate limiting: 10 attempts per 15 minutes window per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

router.post('/login', loginLimiter, authController.login);
router.post('/register', loginLimiter, authController.register);
router.post('/signup', loginLimiter, authController.register);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getMe);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
