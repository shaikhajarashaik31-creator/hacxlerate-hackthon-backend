const db = require('../db/database');
const coinService = require('../services/coinService');
const certificateService = require('../services/certificateService');
const performanceService = require('../services/performanceService');

const coursesController = {
  getAllCourses: (req, res) => {
    try {
      const userId = req.user?.id;
      const { category, search } = req.query;

      let query = `
        SELECT 
          c.*,
          u.name AS teacher_name,
          u.email AS teacher_email,
          e.progress_percent,
          e.status AS enrollment_status,
          e.enrolled_at,
          e.completed_at,
          cert.certificate_code
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
        LEFT JOIN certificates cert ON c.id = cert.course_id AND cert.student_id = ?
        WHERE 1=1
      `;
      const params = [userId || null, userId || null];

      if (category && category !== 'All') {
        query += ` AND c.category = ?`;
        params.push(category);
      }

      if (search) {
        query += ` AND (c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      query += ` ORDER BY c.is_extra ASC, c.id ASC`;

      const courses = db.prepare(query).all(...params);

      const categories = db.prepare('SELECT DISTINCT category FROM courses WHERE category IS NOT NULL ORDER BY category ASC').all().map(r => r.category);

      res.json({ courses, categories });
    } catch (err) {
      console.error('Get courses error:', err);
      res.status(500).json({ error: 'Failed to retrieve courses' });
    }
  },

  getCourseById: (req, res) => {
    try {
      const courseId = req.params.id;
      const userId = req.user?.id;

      const course = db.prepare(`
        SELECT 
          c.*,
          u.name AS teacher_name,
          u.email AS teacher_email,
          e.progress_percent,
          e.status AS enrollment_status,
          cert.certificate_code
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
        LEFT JOIN certificates cert ON c.id = cert.course_id AND cert.student_id = ?
        WHERE c.id = ?
      `).get(userId || null, userId || null, courseId);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const notes = db.prepare(`
        SELECT * FROM class_notes WHERE course_id = ? ORDER BY class_date DESC
      `).all(courseId);

      const lessonsCount = db.prepare('SELECT COUNT(*) AS c FROM lessons WHERE course_id = ?').get(courseId)?.c || 0;

      res.json({ course: { ...course, total_lessons: lessonsCount || course.total_lessons }, notes });
    } catch (err) {
      console.error('Get course by id error:', err);
      res.status(500).json({ error: 'Failed to retrieve course details' });
    }
  },

  /**
   * Atomic enrollment transaction for paid or free courses
   */
  enroll: (req, res) => {
    try {
      const studentId = req.user.id;
      const courseId = parseInt(req.params.id, 10);

      const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check if already enrolled
      const existing = db.prepare(`
        SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?
      `).get(studentId, courseId);

      if (existing) {
        return res.status(400).json({ error: 'Already enrolled in this course' });
      }

      // Execute enrollment inside SQLite database transaction
      const enrollTx = db.transaction(() => {
        if (course.is_extra && course.coin_cost > 0) {
          const balance = coinService.getBalance(studentId);
          if (balance < course.coin_cost) {
            throw new Error(`Insufficient coins balance. Required: ${course.coin_cost}, Available: ${balance}`);
          }

          // Write negative ledger entry
          db.prepare(`
            INSERT INTO coins (student_id, amount, reason, reference_key, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(
            studentId,
            -Math.abs(course.coin_cost),
            `Enrolled in ${course.title}`,
            `enroll_${studentId}_${course.id}`
          );
        }

        // Create enrollment
        db.prepare(`
          INSERT INTO enrollments (student_id, course_id, progress_percent, status, enrolled_at)
          VALUES (?, ?, 0, 'in_progress', CURRENT_TIMESTAMP)
        `).run(studentId, courseId);
      });

      try {
        enrollTx();
      } catch (txErr) {
        return res.status(400).json({ error: txErr.message });
      }

      // Recalculate performance
      performanceService.recalcPerformance(studentId);

      const newBalance = coinService.getBalance(studentId);

      res.json({
        success: true,
        message: `Successfully enrolled in ${course.title}!`,
        newBalance
      });
    } catch (err) {
      console.error('Course enrollment error:', err);
      res.status(500).json({ error: 'Failed to enroll in course' });
    }
  },

  /**
   * Retrieve sequential lessons for a course with completion status
   */
  getCourseLessons: (req, res) => {
    try {
      const studentId = req.user.id;
      const courseId = parseInt(req.params.id, 10);

      const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const enrollment = db.prepare(`
        SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?
      `).get(studentId, courseId);

      const certificate = db.prepare(`
        SELECT * FROM certificates WHERE student_id = ? AND course_id = ?
      `).get(studentId, courseId);

      const lessons = db.prepare(`
        SELECT 
          l.*,
          (
            SELECT COUNT(*) FROM lesson_completions lc 
            WHERE lc.lesson_id = l.id AND lc.student_id = ?
          ) AS is_completed
        FROM lessons l
        WHERE l.course_id = ?
        ORDER BY l.lesson_order ASC
      `).all(studentId, courseId).map(l => ({
        ...l,
        is_completed: Boolean(l.is_completed > 0)
      }));

      res.json({
        course,
        enrollment,
        certificate,
        lessons
      });
    } catch (err) {
      console.error('Get course lessons error:', err);
      res.status(500).json({ error: 'Failed to retrieve lessons' });
    }
  },

  /**
   * Mark lesson complete, award +5 coins, update course progress & recalculate performance
   */
  completeLesson: (req, res) => {
    try {
      const studentId = req.user.id;
      const courseId = parseInt(req.params.id, 10);
      const lessonId = parseInt(req.params.lessonId, 10);

      const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(lessonId, courseId);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      // Mark completion in lesson_completions
      db.prepare(`
        INSERT OR IGNORE INTO lesson_completions (student_id, lesson_id, completed_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(studentId, lessonId);

      // Award +5 coins idempotently
      const coinResult = coinService.awardCoins(
        studentId,
        5,
        `Completed lesson: ${lesson.title}`,
        `lesson_${studentId}_${lessonId}`
      );

      // Compute updated course progress
      const totalLessons = db.prepare('SELECT COUNT(*) AS c FROM lessons WHERE course_id = ?').get(courseId)?.c || 1;
      const completedLessons = db.prepare(`
        SELECT COUNT(*) AS c FROM lesson_completions lc
        JOIN lessons l ON lc.lesson_id = l.id
        WHERE lc.student_id = ? AND l.course_id = ?
      `).get(studentId, courseId)?.c || 1;

      const progressPercent = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

      db.prepare(`
        UPDATE enrollments
        SET progress_percent = ?
        WHERE student_id = ? AND course_id = ?
      `).run(progressPercent, studentId, courseId);

      // Recalculate weighted student performance
      performanceService.recalcPerformance(studentId);

      res.json({
        success: true,
        lessonId,
        progress_percent: progressPercent,
        coinsAwarded: coinResult.awarded ? 5 : 0,
        newBalance: coinService.getBalance(studentId)
      });
    } catch (err) {
      console.error('Complete lesson error:', err);
      res.status(500).json({ error: 'Failed to record lesson completion' });
    }
  },

  /**
   * Submit course final quiz (pass >= 70% issues certificate & awards +100 coins)
   */
  submitQuiz: (req, res) => {
    try {
      const studentId = req.user.id;
      const courseId = parseInt(req.params.id, 10);
      const { answers = {} } = req.body;

      const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Fetch questions from lessons table for this course
      const quizLessons = db.prepare(`
        SELECT id, title, quiz_question, quiz_option_a, quiz_option_b, quiz_option_c, quiz_option_d, correct_option
        FROM lessons
        WHERE course_id = ? AND quiz_question IS NOT NULL
        ORDER BY lesson_order ASC
      `).all(courseId);

      if (quizLessons.length === 0) {
        // Fallback pass if no explicit questions configured
        const cert = certificateService.issueCertificate(studentId, courseId);
        coinService.awardCoins(studentId, 100, `Completed course: ${course.title}`, `course_complete_${studentId}_${courseId}`);
        performanceService.recalcPerformance(studentId);
        return res.json({
          passed: true,
          score: 100,
          certificate: cert,
          coinsAwarded: 100,
          newBalance: coinService.getBalance(studentId)
        });
      }

      let correctCount = 0;
      quizLessons.forEach(l => {
        const studentChoice = answers[l.id] || answers[String(l.id)];
        if (studentChoice && String(studentChoice).toUpperCase() === String(l.correct_option).toUpperCase()) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / quizLessons.length) * 100);
      const passed = score >= 70;

      if (!passed) {
        return res.json({
          passed: false,
          score,
          correctCount,
          totalQuestions: quizLessons.length,
          message: `You scored ${score}%. A minimum score of 70% is required to pass and earn your certificate. Please review the lessons and retake the quiz.`
        });
      }

      // Passed! Complete course enrollment
      db.prepare(`
        UPDATE enrollments
        SET status = 'completed', progress_percent = 100, completed_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND course_id = ?
      `).run(studentId, courseId);

      // Issue certificate with unique code
      const cert = certificateService.issueCertificate(studentId, courseId);

      // Award course completion bonus (+100 coins)
      const coinResult = coinService.awardCoins(
        studentId,
        100,
        `Completed course: ${course.title}`,
        `course_complete_${studentId}_${courseId}`
      );

      // Recalculate weighted student performance
      performanceService.recalcPerformance(studentId);

      res.json({
        passed: true,
        score,
        correctCount,
        totalQuestions: quizLessons.length,
        certificate: cert,
        coinsAwarded: coinResult.awarded ? 100 : 0,
        newBalance: coinService.getBalance(studentId)
      });
    } catch (err) {
      console.error('Submit course quiz error:', err);
      res.status(500).json({ error: 'Failed to process course quiz' });
    }
  },

  updateProgress: (req, res) => {
    try {
      const studentId = req.user.id;
      const courseId = parseInt(req.params.id, 10);
      let { progress_percent } = req.body;

      if (progress_percent === undefined) {
        return res.status(400).json({ error: 'progress_percent is required' });
      }

      progress_percent = Math.max(0, Math.min(100, parseInt(progress_percent, 10)));

      const enrollment = db.prepare(`
        SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?
      `).get(studentId, courseId);

      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found for this course' });
      }

      const isComplete = progress_percent >= 100;
      const status = isComplete ? 'completed' : 'in_progress';
      const completedAt = isComplete ? (enrollment.completed_at || new Date().toISOString()) : null;

      db.prepare(`
        UPDATE enrollments
        SET progress_percent = ?, status = ?, completed_at = ?
        WHERE student_id = ? AND course_id = ?
      `).run(progress_percent, status, completedAt, studentId, courseId);

      let certificate = null;
      if (isComplete) {
        certificate = certificateService.issueCertificate(studentId, courseId);
      }

      // Recalculate weighted student performance
      performanceService.recalcPerformance(studentId);

      res.json({
        success: true,
        progress_percent,
        status,
        certificate,
        newBalance: coinService.getBalance(studentId)
      });
    } catch (err) {
      console.error('Update course progress error:', err);
      res.status(500).json({ error: 'Failed to update course progress' });
    }
  },

  getStudentCertificates: (req, res) => {
    try {
      const studentId = req.user.id;
      const certs = certificateService.getCertificatesForStudent(studentId);
      res.json({ certificates: certs });
    } catch (err) {
      console.error('Get student certificates error:', err);
      res.status(500).json({ error: 'Failed to retrieve certificates' });
    }
  },

  getCertificateByCode: (req, res) => {
    try {
      const { code } = req.params;
      const certificate = certificateService.getCertificateByCode(code);
      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found or invalid code' });
      }
      res.json({ certificate, valid: true });
    } catch (err) {
      console.error('Get certificate by code error:', err);
      res.status(500).json({ error: 'Failed to retrieve certificate details' });
    }
  }
};

module.exports = coursesController;
