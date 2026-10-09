const db = require('../db/database');
const aiService = require('../services/aiService');

const aiController = {
  /**
   * Streaming AI Mentor (Server-Sent Events)
   */
  streamChat: async (req, res) => {
    try {
      const userId = req.user.id;
      let { message, sessionId } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      // If no session provided, create one
      if (!sessionId) {
        const title = message.trim().slice(0, 32) + (message.trim().length > 32 ? '...' : '');
        const info = db.prepare(`
          INSERT INTO chat_sessions (user_id, title, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(userId, title);
        sessionId = info.lastInsertRowid;
      } else {
        // Verify session belongs to user
        const sess = db.prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?').get(sessionId, userId);
        if (!sess) {
          const title = message.trim().slice(0, 32);
          const info = db.prepare(`
            INSERT INTO chat_sessions (user_id, title, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `).run(userId, title);
          sessionId = info.lastInsertRowid;
        }
      }

      // Record student's message
      db.prepare(`
        INSERT INTO chat_history (user_id, session_id, role, message, created_at)
        VALUES (?, ?, 'user', ?, CURRENT_TIMESTAMP)
      `).run(userId, sessionId, message.trim());

      // Student personalization context
      const user = db.prepare('SELECT name, department FROM users WHERE id = ?').get(userId);
      const weakRows = db.prepare(`
        SELECT c.title FROM performance p 
        JOIN courses c ON p.course_id = c.id 
        WHERE p.student_id = ? AND p.score < 80
      `).all(userId);
      const courseRows = db.prepare(`
        SELECT c.title FROM enrollments e 
        JOIN courses c ON e.course_id = c.id 
        WHERE e.student_id = ?
      `).all(userId);

      const studentContext = {
        name: user?.name || 'Student',
        weakSubjects: weakRows.map(r => r.title).join(', ') || 'None identified yet',
        enrolledCourses: courseRows.map(r => r.title).join(', ') || 'General Engineering'
      };

      // Retrieve recent conversation context (last 20 messages)
      const history = db.prepare(`
        SELECT role, message FROM chat_history
        WHERE user_id = ? AND session_id = ?
        ORDER BY id ASC
        LIMIT 20
      `).all(userId, sessionId);

      // Setup Server-Sent Events headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let fullResponseText = '';

      try {
        fullResponseText = await aiService.streamChat(message, history, studentContext, chunk => {
          res.write(`data: ${JSON.stringify({ chunk, sessionId })}\n\n`);
        });
      } catch (streamErr) {
        console.error('Error during AI streaming:', streamErr);
        const retryChunk = ' I experienced a momentary network delay. Please click retry or rephrase your question!';
        fullResponseText += retryChunk;
        res.write(`data: ${JSON.stringify({ chunk: retryChunk, sessionId })}\n\n`);
      }

      // Persist assistant response
      if (fullResponseText.trim().length > 0) {
        db.prepare(`
          INSERT INTO chat_history (user_id, session_id, role, message, created_at)
          VALUES (?, ?, 'assistant', ?, CURRENT_TIMESTAMP)
        `).run(userId, sessionId, fullResponseText.trim());
      }

      // Send completion signal
      res.write(`data: ${JSON.stringify({ done: true, sessionId })}\n\n`);
      res.end();
    } catch (err) {
      console.error('AI chat stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process AI chat stream' });
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted. Please retry.', done: true })}\n\n`);
        res.end();
      }
    }
  },

  /**
   * Session Management
   */
  getSessions: (req, res) => {
    try {
      const userId = req.user.id;
      const sessions = db.prepare(`
        SELECT s.id, s.title, s.created_at,
               (SELECT COUNT(*) FROM chat_history WHERE session_id = s.id) AS message_count,
               (SELECT message FROM chat_history WHERE session_id = s.id ORDER BY id DESC LIMIT 1) AS last_message
        FROM chat_sessions s
        WHERE s.user_id = ?
        ORDER BY s.id DESC
      `).all(userId);

      res.json({ sessions });
    } catch (err) {
      console.error('Get sessions error:', err);
      res.status(500).json({ error: 'Failed to retrieve chat sessions' });
    }
  },

  createSession: (req, res) => {
    try {
      const userId = req.user.id;
      const { title = 'New Conversation' } = req.body;

      const info = db.prepare(`
        INSERT INTO chat_sessions (user_id, title, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(userId, title.trim());

      const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json({ session });
    } catch (err) {
      console.error('Create session error:', err);
      res.status(500).json({ error: 'Failed to create chat session' });
    }
  },

  renameSession: (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.params.id;
      const { title } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }

      const info = db.prepare(`
        UPDATE chat_sessions SET title = ? WHERE id = ? AND user_id = ?
      `).run(title.trim(), sessionId, userId);

      if (info.changes === 0) {
        return res.status(404).json({ error: 'Session not found or unauthorized' });
      }

      res.json({ success: true, title: title.trim() });
    } catch (err) {
      console.error('Rename session error:', err);
      res.status(500).json({ error: 'Failed to rename chat session' });
    }
  },

  deleteSession: (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.params.id;

      db.prepare('DELETE FROM chat_history WHERE session_id = ? AND user_id = ?').run(sessionId, userId);
      const info = db.prepare('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?').run(sessionId, userId);

      if (info.changes === 0) {
        return res.status(404).json({ error: 'Session not found or unauthorized' });
      }

      res.json({ success: true, message: 'Session deleted' });
    } catch (err) {
      console.error('Delete session error:', err);
      res.status(500).json({ error: 'Failed to delete chat session' });
    }
  },

  getSessionMessages: (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.params.id;

      const messages = db.prepare(`
        SELECT id, role, message, created_at
        FROM chat_history
        WHERE session_id = ? AND user_id = ?
        ORDER BY id ASC
      `).all(sessionId, userId);

      res.json({ messages });
    } catch (err) {
      console.error('Get session messages error:', err);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  },

  clearChatHistory: (req, res) => {
    try {
      const userId = req.user.id;
      db.prepare('DELETE FROM chat_history WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM chat_sessions WHERE user_id = ?').run(userId);
      res.json({ success: true, message: 'Chat history cleared' });
    } catch (err) {
      console.error('Clear chat history error:', err);
      res.status(500).json({ error: 'Failed to clear chat history' });
    }
  },

  /**
   * Resume Generation & ATS Score
   */
  generateResume: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { targetRole = 'Web Developer', template = 'modern' } = req.body;
      const student = db.prepare('SELECT * FROM users WHERE id = ?').get(studentId);

      const resumeContent = await aiService.generateResume({
        ...student,
        ...req.body
      });

      const atsAnalysis = await aiService.calculateAtsScore(resumeContent, targetRole);

      // Determine next version number
      const prevVersion = db.prepare(`
        SELECT MAX(version) AS max_v FROM resumes WHERE student_id = ?
      `).get(studentId)?.max_v || 0;
      const nextVersion = prevVersion + 1;

      // Save version in resumes table
      db.prepare(`
        INSERT INTO resumes (
          student_id, content_json, ats_score, target_role, template,
          version, breakdown_json, missing_keywords_json, improvement_tips_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        studentId,
        JSON.stringify(resumeContent),
        atsAnalysis.score,
        targetRole,
        template,
        nextVersion,
        JSON.stringify(atsAnalysis.breakdownList),
        JSON.stringify(atsAnalysis.missingKeywords),
        JSON.stringify(atsAnalysis.improvementTips)
      );

      res.json({
        resume: resumeContent,
        atsAnalysis,
        version: nextVersion,
        targetRole,
        template
      });
    } catch (err) {
      console.error('Resume generation error:', err);
      res.status(500).json({ error: 'Failed to generate resume' });
    }
  },

  improveResume: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { currentResume, targetRole = 'Web Developer', template = 'modern' } = req.body;

      if (!currentResume) {
        return res.status(400).json({ error: 'currentResume is required' });
      }

      const improvedContent = await aiService.improveResume(currentResume, targetRole);
      const atsAnalysis = await aiService.calculateAtsScore(improvedContent, targetRole);

      const prevVersion = db.prepare(`
        SELECT MAX(version) AS max_v FROM resumes WHERE student_id = ?
      `).get(studentId)?.max_v || 0;
      const nextVersion = prevVersion + 1;

      db.prepare(`
        INSERT INTO resumes (
          student_id, content_json, ats_score, target_role, template,
          version, breakdown_json, missing_keywords_json, improvement_tips_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        studentId,
        JSON.stringify(improvedContent),
        atsAnalysis.score,
        targetRole,
        template,
        nextVersion,
        JSON.stringify(atsAnalysis.breakdownList),
        JSON.stringify(atsAnalysis.missingKeywords),
        JSON.stringify(atsAnalysis.improvementTips)
      );

      res.json({
        resume: improvedContent,
        atsAnalysis,
        version: nextVersion,
        targetRole,
        template
      });
    } catch (err) {
      console.error('Improve resume error:', err);
      res.status(500).json({ error: 'Failed to improve resume with AI' });
    }
  },

  getSavedResume: (req, res) => {
    try {
      const studentId = req.user.id;
      const resumeRow = db.prepare(`
        SELECT * FROM resumes WHERE student_id = ? ORDER BY version DESC, id DESC LIMIT 1
      `).get(studentId);

      if (!resumeRow) {
        return res.json({ resume: null, atsScore: 0 });
      }

      res.json({
        resume: JSON.parse(resumeRow.content_json),
        atsScore: resumeRow.ats_score,
        targetRole: resumeRow.target_role || 'Web Developer',
        template: resumeRow.template || 'modern',
        version: resumeRow.version || 1,
        breakdownList: resumeRow.breakdown_json ? JSON.parse(resumeRow.breakdown_json) : [],
        missingKeywords: resumeRow.missing_keywords_json ? JSON.parse(resumeRow.missing_keywords_json) : [],
        improvementTips: resumeRow.improvement_tips_json ? JSON.parse(resumeRow.improvement_tips_json) : [],
        updatedAt: resumeRow.updated_at
      });
    } catch (err) {
      console.error('Get saved resume error:', err);
      res.status(500).json({ error: 'Failed to retrieve saved resume' });
    }
  },

  calculateAtsScore: async (req, res) => {
    try {
      const { resumeData, targetRole = 'Web Developer' } = req.body;
      if (!resumeData) {
        return res.status(400).json({ error: 'resumeData is required' });
      }

      const analysis = await aiService.calculateAtsScore(resumeData, targetRole);
      res.json(analysis);
    } catch (err) {
      console.error('ATS score calculation error:', err);
      res.status(500).json({ error: 'Failed to analyze ATS score' });
    }
  },

  /**
   * Mock Interview
   */
  interviewQuestion: async (req, res) => {
    try {
      const { type = 'technical', questionNumber = 1, previousRounds = [] } = req.body;
      const question = await aiService.generateInterviewQuestion(type, questionNumber, previousRounds);
      res.json({ question });
    } catch (err) {
      console.error('Interview question error:', err);
      res.status(500).json({ error: 'Failed to generate interview question' });
    }
  },

  evaluateInterview: async (req, res) => {
    try {
      const { question, answer, type = 'technical' } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ error: 'Question and answer are required' });
      }

      const evaluation = await aiService.evaluateInterviewAnswer(question, answer, type);
      res.json(evaluation);
    } catch (err) {
      console.error('Evaluate interview error:', err);
      res.status(500).json({ error: 'Failed to evaluate interview response' });
    }
  },

  synthesizeMissedNotes: async (req, res) => {
    try {
      const { courseTitle, classDate, rawNotes } = req.body;
      const pages = await aiService.generateMultiPageNotes(courseTitle, classDate, rawNotes);
      res.json({ pages });
    } catch (err) {
      console.error('Synthesize missed notes error:', err);
      res.status(500).json({ error: 'Failed to synthesize missed notes' });
    }
  }
};

module.exports = aiController;
