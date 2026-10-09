const db = require('../db/database');
const judge0Service = require('../services/judge0Service');
const performanceService = require('../services/performanceService');

const codeController = {
  runCode: async (req, res) => {
    try {
      const { language = 'javascript', code = '', stdin = '' } = req.body;

      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      const result = await judge0Service.runCode(language, code, stdin);
      res.json(result);
    } catch (err) {
      console.error('Code execution error:', err);
      res.status(500).json({ error: 'Failed to execute code' });
    }
  },

  getProjects: (req, res) => {
    try {
      const studentId = req.user.id;
      const projects = db.prepare(`
        SELECT * FROM projects
        WHERE student_id = ?
        ORDER BY updated_at DESC
      `).all(studentId);

      res.json({ projects });
    } catch (err) {
      console.error('Get projects error:', err);
      res.status(500).json({ error: 'Failed to retrieve projects' });
    }
  },

  getProjectById: (req, res) => {
    try {
      const studentId = req.user.id;
      const projectId = req.params.id;

      const project = db.prepare(`
        SELECT * FROM projects WHERE id = ? AND student_id = ?
      `).get(projectId, studentId);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({ project });
    } catch (err) {
      console.error('Get project by id error:', err);
      res.status(500).json({ error: 'Failed to retrieve project' });
    }
  },

  createProject: (req, res) => {
    try {
      const studentId = req.user.id;
      const { title, description = '', language = 'javascript', code = '' } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Project title is required' });
      }

      const info = db.prepare(`
        INSERT INTO projects (student_id, title, description, language, code, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(studentId, title, description, language, code);

      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
      performanceService.recalcPerformance(studentId);
      res.status(201).json({ project });
    } catch (err) {
      console.error('Create project error:', err);
      res.status(500).json({ error: 'Failed to create project' });
    }
  },

  updateProject: (req, res) => {
    try {
      const studentId = req.user.id;
      const projectId = req.params.id;
      const { title, description, language, code } = req.body;

      const existing = db.prepare('SELECT * FROM projects WHERE id = ? AND student_id = ?').get(projectId, studentId);
      if (!existing) {
        return res.status(404).json({ error: 'Project not found' });
      }

      db.prepare(`
        UPDATE projects
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            language = COALESCE(?, language),
            code = COALESCE(?, code),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND student_id = ?
      `).run(
        title !== undefined ? title : existing.title,
        description !== undefined ? description : existing.description,
        language !== undefined ? language : existing.language,
        code !== undefined ? code : existing.code,
        projectId,
        studentId
      );

      const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
      performanceService.recalcPerformance(studentId);
      res.json({ project: updated });
    } catch (err) {
      console.error('Update project error:', err);
      res.status(500).json({ error: 'Failed to update project' });
    }
  },

  deleteProject: (req, res) => {
    try {
      const studentId = req.user.id;
      const projectId = req.params.id;

      const info = db.prepare('DELETE FROM projects WHERE id = ? AND student_id = ?').run(projectId, studentId);
      if (info.changes === 0) {
        return res.status(404).json({ error: 'Project not found or unauthorized' });
      }

      res.json({ success: true, message: 'Project deleted' });
    } catch (err) {
      console.error('Delete project error:', err);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
};

module.exports = codeController;
