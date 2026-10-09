const db = require('../db/database');
const aiService = require('../services/aiService');
const performanceService = require('../services/performanceService');

const teacherController = {
  getDashboard: (req, res) => {
    try {
      const teacherId = req.user.id;

      // 1. Teacher courses
      const teacherCourses = db.prepare(`
        SELECT id, title, total_lessons, is_extra FROM courses WHERE teacher_id = ?
      `).all(teacherId);

      const courseIds = teacherCourses.map(c => c.id);
      const courseIdPlaceholders = courseIds.length ? courseIds.map(() => '?').join(',') : 'NULL';

      // 2. Total unique students enrolled in teacher's courses
      const studentsCountRow = courseIds.length ? db.prepare(`
        SELECT COUNT(DISTINCT student_id) AS total_students
        FROM enrollments
        WHERE course_id IN (${courseIdPlaceholders})
      `).get(...courseIds) : { total_students: 0 };

      // 3. Class attendance average for teacher's courses
      const attAvgRow = courseIds.length ? db.prepare(`
        SELECT 
          COUNT(*) AS total_records,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count
        FROM attendance
        WHERE course_id IN (${courseIdPlaceholders})
      `).get(...courseIds) : { total_records: 0, present_count: 0 };

      const classAttendanceAvg = attAvgRow.total_records > 0
        ? Math.round((attAvgRow.present_count / attAvgRow.total_records) * 100)
        : 88;

      // 4. Average performance in teacher's courses
      const perfAvgRow = courseIds.length ? db.prepare(`
        SELECT AVG(score) AS avg_score
        FROM performance
        WHERE course_id IN (${courseIdPlaceholders})
      `).get(...courseIds) : { avg_score: 82 };

      const averagePerformance = perfAvgRow.avg_score !== null
        ? Math.round(perfAvgRow.avg_score)
        : 82;

      // 5. Today's logged-in students for this teacher
      const todayDate = new Date().toISOString().slice(0, 10);
      const todayLogins = courseIds.length ? db.prepare(`
        SELECT DISTINCT u.id, u.name, u.email, MAX(l.login_time) AS last_login, l.ip
        FROM login_logs l
        JOIN users u ON l.user_id = u.id
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.course_id IN (${courseIdPlaceholders})
          AND date(l.login_time) = date('now')
        GROUP BY u.id
        ORDER BY last_login DESC
      `).all(...courseIds) : [];

      // 6. Course-wise student distribution
      const coursesDistribution = teacherCourses.map(course => {
        const enrolledCount = db.prepare(`
          SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ?
        `).get(course.id)?.count || 0;

        const avgScore = db.prepare(`
          SELECT AVG(score) AS avg_score FROM performance WHERE course_id = ?
        `).get(course.id)?.avg_score || 0;

        return {
          id: course.id,
          title: course.title,
          is_extra: course.is_extra,
          enrolledCount,
          averageScore: Math.round(avgScore)
        };
      });

      res.json({
        stats: {
          totalStudents: studentsCountRow.total_students,
          totalCourses: teacherCourses.length,
          classAttendanceAvg,
          averagePerformance,
          todayActiveCount: todayLogins.length
        },
        todayLogins,
        coursesDistribution
      });
    } catch (err) {
      console.error('Teacher dashboard error:', err);
      res.status(500).json({ error: 'Failed to load teacher dashboard' });
    }
  },

  getMyStudents: (req, res) => {
    try {
      const teacherId = req.user.id;

      // Find all courses taught by this teacher
      const courses = db.prepare('SELECT id FROM courses WHERE teacher_id = ?').all(teacherId);
      const courseIds = courses.map(c => c.id);

      if (courseIds.length === 0) {
        return res.json({ students: [] });
      }

      const placeholders = courseIds.map(() => '?').join(',');

      // For each student enrolled in any of teacher's courses, calculate attendance % & avg score in those courses
      const query = `
        SELECT 
          u.id, u.name, u.email, u.department, u.skills,
          (
            SELECT MAX(l.login_time)
            FROM login_logs l
            WHERE l.user_id = u.id
          ) AS last_login,
          (
            SELECT 
              ROUND(CAST(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS REAL) * 100 / NULLIF(COUNT(a.id), 0))
            FROM attendance a
            WHERE a.student_id = u.id AND a.course_id IN (${placeholders})
          ) AS attendance_rate,
          (
            SELECT ROUND(AVG(p.score))
            FROM performance p
            WHERE p.student_id = u.id AND p.course_id IN (${placeholders})
          ) AS average_score,
          (
            SELECT GROUP_CONCAT(c.title, ', ')
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = u.id AND e.course_id IN (${placeholders})
          ) AS enrolled_courses
        FROM users u
        WHERE u.id IN (
          SELECT DISTINCT student_id FROM enrollments WHERE course_id IN (${placeholders})
        )
        ORDER BY u.name ASC
      `;

      // Pass placeholders 4 times
      const params = [...courseIds, ...courseIds, ...courseIds, ...courseIds];
      const students = db.prepare(query).all(...params).map(s => ({
        ...s,
        attendance_rate: s.attendance_rate !== null ? s.attendance_rate : 100,
        average_score: s.average_score !== null ? s.average_score : 80
      }));

      res.json({ students });
    } catch (err) {
      console.error('Get my students error:', err);
      res.status(500).json({ error: 'Failed to retrieve students' });
    }
  },

  getStudentLogins: (req, res) => {
    try {
      const teacherId = req.user.id;

      // Find all courses taught by this teacher
      const courses = db.prepare('SELECT id FROM courses WHERE teacher_id = ?').all(teacherId);
      const courseIds = courses.map(c => c.id);

      if (courseIds.length === 0) {
        return res.json({ logins: [] });
      }

      const placeholders = courseIds.map(() => '?').join(',');

      const logins = db.prepare(`
        SELECT 
          l.id, l.user_id, l.login_time, l.logout_time, l.ip,
          u.name AS student_name, u.email AS student_email, u.department
        FROM login_logs l
        JOIN users u ON l.user_id = u.id
        WHERE u.id IN (
          SELECT DISTINCT student_id FROM enrollments WHERE course_id IN (${placeholders})
        )
        ORDER BY l.login_time DESC
        LIMIT 100
      `).all(...courseIds).map(l => {
        let durationMinutes = null;
        if (l.login_time && l.logout_time) {
          const start = new Date(l.login_time).getTime();
          const end = new Date(l.logout_time).getTime();
          durationMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
        }
        return {
          ...l,
          duration_minutes: durationMinutes
        };
      });

      res.json({ logins });
    } catch (err) {
      console.error('Get student logins error:', err);
      res.status(500).json({ error: 'Failed to retrieve student logins' });
    }
  },

  getFeedbackSummary: async (req, res) => {
    try {
      const teacherId = req.user.id;

      // 1. Find all courses for this teacher
      const courses = db.prepare('SELECT id FROM courses WHERE teacher_id = ?').all(teacherId);
      const courseIds = courses.map(c => c.id);

      if (courseIds.length === 0) {
        return res.json({
          summary: {
            totalAnalyzed: 0,
            overallSentiment: 'No feedback',
            strengths: [],
            areasToImprove: [],
            actionPoints: [],
            executiveSummary: 'No courses found for this teacher.'
          },
          eligibleCount: 0,
          totalFeedbackCount: 0,
          eligibleComments: []
        });
      }

      const placeholders = courseIds.map(() => '?').join(',');

      // 2. Fetch all raw feedback for this teacher
      const allFeedback = db.prepare(`
        SELECT f.*, u.name AS student_name, c.title AS course_title
        FROM feedback f
        JOIN users u ON f.student_id = u.id
        JOIN courses c ON f.course_id = c.id
        WHERE f.teacher_id = ?
        ORDER BY f.created_at DESC
      `).all(teacherId);

      // 3. FILTER strictly: Only students with attendance >= 80% AND performance >= 80%
      const eligibleFeedbacks = [];

      for (const fb of allFeedback) {
        // Calculate student's attendance in this teacher's courses
        const attRow = db.prepare(`
          SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present
          FROM attendance
          WHERE student_id = ? AND course_id IN (${placeholders})
        `).get(fb.student_id, ...courseIds);

        const attendanceRate = attRow && attRow.total > 0
          ? Math.round((attRow.present / attRow.total) * 100)
          : 0;

        // Calculate student's average score in this teacher's courses
        const perfRow = db.prepare(`
          SELECT AVG(score) AS avg_score
          FROM performance
          WHERE student_id = ? AND course_id IN (${placeholders})
        `).get(fb.student_id, ...courseIds);

        const avgScore = perfRow && perfRow.avg_score !== null
          ? Math.round(perfRow.avg_score)
          : 0;

        // Strict criteria filter (Attendance >= 80% AND Performance >= 80%)
        if (attendanceRate >= 80 && avgScore >= 80) {
          eligibleFeedbacks.push({
            ...fb,
            attendance_rate: attendanceRate,
            score: avgScore
          });
        }
      }

      // 4. Calculate included vs excluded
      const includedCount = eligibleFeedbacks.length;
      const excludedCount = allFeedback.length - eligibleFeedbacks.length;
      const includedStudents = [...new Set(eligibleFeedbacks.map(f => f.student_name))];

      // Strict Rule: If fewer than 3 students qualify, show a message instead of a summary
      if (eligibleFeedbacks.length < 3) {
        return res.json({
          insufficientCohort: true,
          message: `Only ${eligibleFeedbacks.length} student(s) met the strict honors threshold (Attendance ≥ 80% and Performance ≥ 80%). A minimum of 3 qualifying students is strictly required to synthesize an AI teaching executive summary.`,
          summary: null,
          eligibleCount: includedCount,
          totalFeedbackCount: allFeedback.length,
          includedCount,
          excludedCount,
          includedStudents,
          eligibleComments: eligibleFeedbacks
        });
      }

      // 5. Send only qualifying comments to Gemini to generate 5 action points & summary
      const summary = await aiService.generateFeedbackSummary(eligibleFeedbacks);

      res.json({
        insufficientCohort: false,
        summary,
        eligibleCount: includedCount,
        totalFeedbackCount: allFeedback.length,
        includedCount,
        excludedCount,
        includedStudents,
        eligibleComments: eligibleFeedbacks
      });
    } catch (err) {
      console.error('Teacher feedback summary error:', err);
      res.status(500).json({ error: 'Failed to generate feedback summary' });
    }
  },

  markAttendance: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { student_id, course_id, class_date, status = 'present' } = req.body;

      if (!student_id || !course_id || !class_date) {
        return res.status(400).json({ error: 'student_id, course_id, and class_date are required' });
      }

      const course = db.prepare('SELECT * FROM courses WHERE id = ? AND teacher_id = ?').get(course_id, teacherId);
      if (!course) {
        return res.status(403).json({ error: 'Course not found or unauthorized' });
      }

      const existingAtt = db.prepare('SELECT id FROM attendance WHERE student_id = ? AND course_id = ? AND class_date = ?').get(student_id, course_id, class_date);
      if (existingAtt) {
        db.prepare('UPDATE attendance SET status = ? WHERE id = ?').run(status, existingAtt.id);
      } else {
        db.prepare('INSERT INTO attendance (student_id, course_id, class_date, status) VALUES (?, ?, ?, ?)').run(student_id, course_id, class_date, status);
      }

      // If marked absent, trigger automatic multi-page lecture notes synthesis
      if (status === 'absent') {
        const existingNotes = db.prepare('SELECT id FROM class_notes WHERE course_id = ? AND class_date = ?').get(course_id, class_date);
        if (!existingNotes) {
          const pages = await aiService.generateMultiPageNotes(course.title, class_date);
          for (const p of pages) {
            db.prepare(`
              INSERT INTO class_notes (course_id, class_date, title, content, page_number, svg_diagram, is_revised, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            `).run(course_id, class_date, p.title, p.content, p.page_number, p.svg_diagram || null);
          }
        }
      }

      // Trigger automatic performance recalculation
      performanceService.recalcPerformance(student_id);

      res.json({ success: true, message: `Attendance updated to '${status}'` });
    } catch (err) {
      console.error('Mark attendance error:', err);
      res.status(500).json({ error: 'Failed to record attendance' });
    }
  },

  getAnalytics: (req, res) => {
    try {
      const teacherId = req.user.id;

      // 1. Time spent per student across teacher's courses
      const timePerStudent = db.prepare(`
        SELECT 
          u.name AS student_name,
          u.id AS student_id,
          COALESCE(SUM(al.duration_seconds), 0) / 60 AS minutes_spent
        FROM users u
        LEFT JOIN activity_logs al ON u.id = al.user_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name
        ORDER BY minutes_spent DESC
        LIMIT 12
      `).all();

      // 2. Time spent per course
      const timePerCourse = db.prepare(`
        SELECT 
          c.title AS course_title,
          c.id AS course_id,
          COALESCE(SUM(al.duration_seconds), 0) / 60 AS minutes_spent
        FROM courses c
        LEFT JOIN activity_logs al ON c.id = al.course_id
        WHERE c.teacher_id = ?
        GROUP BY c.id, c.title
      `).all(teacherId);

      // 3. Test durations & average scores
      const testDurations = db.prepare(`
        SELECT 
          t.title AS test_title,
          AVG(ta.time_taken_seconds) / 60 AS avg_duration_minutes,
          AVG(ta.score) AS avg_score,
          COUNT(ta.id) AS total_submissions
        FROM tests t
        JOIN courses c ON t.course_id = c.id
        LEFT JOIN test_attempts ta ON t.id = ta.test_id
        WHERE c.teacher_id = ?
        GROUP BY t.id, t.title
      `).all(teacherId).map(t => ({
        ...t,
        avg_duration_minutes: Math.round((t.avg_duration_minutes || 10) * 10) / 10,
        avg_score: Math.round(t.avg_score || 0)
      }));

      res.json({
        timePerStudent,
        timePerCourse,
        testDurations
      });
    } catch (err) {
      console.error('Teacher analytics error:', err);
      res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
  }
};

module.exports = teacherController;
