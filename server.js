const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Ensure DB is initialized and migrated
require('./db/database');
const { runMigrations } = require('./db/migrate');
runMigrations();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const coursesRoutes = require('./routes/courses');
const testsRoutes = require('./routes/tests');
const codeRoutes = require('./routes/code');
const practiceRoutes = require('./routes/practice');
const activityRoutes = require('./routes/activity');

const activityLogger = require('./middleware/activityLogger');
const coursesController = require('./controllers/coursesController');
const codeController = require('./controllers/codeController');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(activityLogger);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'EduPulse AI',
    timestamp: new Date().toISOString()
  });
});

// Primary Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/activity', activityRoutes);

// Direct compatibility aliases (allowing calls with or without /api prefix)
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/admin', adminRoutes);
app.use('/practice', practiceRoutes);

// Public Certificate Verification Endpoint
app.get('/api/courses/verify/:code', coursesController.getCertificateByCode);
app.get('/api/verify/:code', coursesController.getCertificateByCode);
app.get('/verify/:code', coursesController.getCertificateByCode);

// Explicit aliases for direct endpoints specified in requirements
// e.g. GET /api/student/certificates
app.get('/api/student/certificates', authMiddleware, coursesController.getStudentCertificates);

// e.g. /api/projects CRUD endpoints
app.get('/api/projects', authMiddleware, codeController.getProjects);
app.get('/api/projects/:id', authMiddleware, codeController.getProjectById);
app.post('/api/projects', authMiddleware, codeController.createProject);
app.put('/api/projects/:id', authMiddleware, codeController.updateProject);
app.delete('/api/projects/:id', authMiddleware, codeController.deleteProject);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint '${req.originalUrl}' not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 EduPulse AI Server running on port ${PORT}`);
  console.log(`📡 REST API mounted at http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});
