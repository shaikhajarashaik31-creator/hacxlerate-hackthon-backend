const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const authMiddleware = require('../middleware/auth');

const jwt = require('jsonwebtoken');

// Optional auth for /run so public editor can execute code
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'edupulse_jwt_secret_production_ready_key_hackathon_2026';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // ignore invalid token for optional auth
    }
  }
  next();
};

// Code execution endpoint (public or authenticated)
router.post('/run', optionalAuth, codeController.runCode);

// Require auth for projects CRUD endpoints
router.use(authMiddleware);

// Projects CRUD endpoints under /code or /projects
router.get('/projects', codeController.getProjects);
router.get('/projects/:id', codeController.getProjectById);
router.post('/projects', codeController.createProject);
router.put('/projects/:id', codeController.updateProject);
router.delete('/projects/:id', codeController.deleteProject);

module.exports = router;
