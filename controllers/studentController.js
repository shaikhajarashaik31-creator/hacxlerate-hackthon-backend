const db = require('../db/database');
const coinService = require('../services/coinService');
const aiService = require('../services/aiService');
const performanceService = require('../services/performanceService');

const studentController = {
  getDashboard: (req, res) => {
    try {
      const studentId = req.user.id;

      // 1. Attendance percentage
      const attRow = db.prepare(`
        SELECT 
          COUNT(*) AS total_classes,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count
        FROM attendance
        WHERE student_id = ?
      `).get(studentId);

      const attendanceRate = attRow && attRow.total_classes > 0
        ? Math.round((attRow.present_count / attRow.total_classes) * 100)
        : 100;

      // 2. Average performance
      const perfRow = db.prepare(`
        SELECT AVG(score) AS avg_score, COUNT(*) AS total_graded
        FROM performance
        WHERE student_id = ?
      `).get(studentId);

      const averageScore = perfRow && perfRow.avg_score !== null
        ? Math.round(perfRow.avg_score)
        : 0;

      // 3. Coins balance
      const coinBalance = coinService.getBalance(studentId);

      // 4. Courses in progress / enrolled
      const coursesRow = db.prepare(`
        SELECT 
          COUNT(*) AS total_enrolled,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count
        FROM enrollments
        WHERE student_id = ?
      `).get(studentId);

      // 5. Course-wise breakdown for charts
      const coursePerformance = db.prepare(`
        SELECT c.id, c.title, p.score, e.progress_percent, e.status
        FROM courses c
        JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
        LEFT JOIN performance p ON c.id = p.course_id AND p.student_id = ?
        ORDER BY c.id ASC
      `).all(studentId, studentId);

      const courseAttendance = db.prepare(`
        SELECT c.id, c.title,
          COUNT(a.id) AS total_classes,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count
        FROM courses c
        JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
        LEFT JOIN attendance a ON c.id = a.course_id AND a.student_id = ?
        GROUP BY c.id, c.title
      `).all(studentId, studentId).map(c => ({
        ...c,
        rate: c.total_classes > 0 ? Math.round((c.present_count / c.total_classes) * 100) : 100
      }));

      // 6. Recent test attempts
      const recentTests = db.prepare(`
        SELECT ta.score, ta.time_taken_seconds, ta.taken_at, t.title AS test_title
        FROM test_attempts ta
        JOIN tests t ON ta.test_id = t.id
        WHERE ta.student_id = ?
        ORDER BY ta.taken_at DESC
        LIMIT 5
      `).all(studentId);

      // 7. Recent activity time logs
      const recentActivities = db.prepare(`
        SELECT event_type, duration_seconds, page, created_at
        FROM activity_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 6
      `).all(studentId);

      // 8. Certificates count
      const certCountRow = db.prepare(`
        SELECT COUNT(*) AS total_certs FROM certificates WHERE student_id = ?
      `).get(studentId);

      res.json({
        stats: {
          attendanceRate,
          averageScore,
          coinBalance,
          coursesInProgress: coursesRow?.in_progress_count || 0,
          completedCourses: coursesRow?.completed_count || 0,
          totalCertificates: certCountRow?.total_certs || 0
        },
        charts: {
          coursePerformance,
          courseAttendance,
          recentTests
        },
        recentActivities
      });
    } catch (err) {
      console.error('Student dashboard error:', err);
      res.status(500).json({ error: 'Failed to load student dashboard metrics' });
    }
  },

  getAttendance: (req, res) => {
    try {
      const studentId = req.user.id;

      // Summary
      const summary = db.prepare(`
        SELECT 
          COUNT(*) AS total_classes,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count
        FROM attendance
        WHERE student_id = ?
      `).get(studentId);

      const overallRate = summary && summary.total_classes > 0
        ? Math.round((summary.present_count / summary.total_classes) * 100)
        : 100;

      // Per course
      const perCourse = db.prepare(`
        SELECT 
          c.id AS course_id,
          c.title AS course_title,
          COUNT(a.id) AS total_classes,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count
        FROM courses c
        JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
        LEFT JOIN attendance a ON c.id = a.course_id AND a.student_id = ?
        GROUP BY c.id, c.title
      `).all(studentId, studentId).map(c => ({
        ...c,
        attendance_percentage: c.total_classes > 0
          ? Math.round((c.present_count / c.total_classes) * 100)
          : 100
      }));

      // History logs with check if notes exist for absent days
      const logs = db.prepare(`
        SELECT 
          a.id, a.course_id, a.class_date, a.status,
          c.title AS course_title,
          cn.id AS notes_id,
          cn.title AS notes_title
        FROM attendance a
        JOIN courses c ON a.course_id = c.id
        LEFT JOIN class_notes cn ON a.course_id = cn.course_id AND a.class_date = cn.class_date
        WHERE a.student_id = ?
        ORDER BY a.class_date DESC, a.id DESC
      `).all(studentId);

      res.json({
        summary: {
          totalClasses: summary?.total_classes || 0,
          presentCount: summary?.present_count || 0,
          absentCount: summary?.absent_count || 0,
          overallRate
        },
        perCourse,
        logs
      });
    } catch (err) {
      console.error('Student attendance error:', err);
      res.status(500).json({ error: 'Failed to retrieve attendance records' });
    }
  },

  getLogins: (req, res) => {
    try {
      const studentId = req.user.id;

      const logins = db.prepare(`
        SELECT id, login_time, logout_time, ip
        FROM login_logs
        WHERE user_id = ?
        ORDER BY login_time DESC
        LIMIT 50
      `).all(studentId).map(l => {
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
      console.error('Student logins error:', err);
      res.status(500).json({ error: 'Failed to retrieve login logs' });
    }
  },

  getTrend: (req, res) => {
    try {
      const studentId = req.user.id;
      const trend = performanceService.getPerformanceTrend(studentId);
      res.json({ trend });
    } catch (err) {
      console.error('Get student performance trend error:', err);
      res.status(500).json({ error: 'Failed to retrieve performance trend' });
    }
  },

  getNotes: (req, res) => {
    try {
      const studentId = req.user.id;
      const { course_id, class_date, search } = req.query;

      // 1. Get all missed classes for this student
      let missedQuery = `
        SELECT 
          a.id AS attendance_id,
          a.course_id,
          a.class_date,
          c.title AS course_title,
          c.category AS course_category,
          u.name AS teacher_name
        FROM attendance a
        JOIN courses c ON a.course_id = c.id
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE a.student_id = ? AND a.status = 'absent'
      `;
      const params = [studentId];

      if (course_id) {
        missedQuery += ` AND a.course_id = ?`;
        params.push(course_id);
      }
      if (class_date) {
        missedQuery += ` AND a.class_date = ?`;
        params.push(class_date);
      }

      missedQuery += ` ORDER BY a.class_date DESC`;
      const missedClasses = db.prepare(missedQuery).all(...params);

      // 2. For each missed class session, retrieve all notebook pages
      const sessions = missedClasses.map(session => {
        const pages = db.prepare(`
          SELECT id, page_number, title, content, svg_diagram, is_revised, created_at
          FROM class_notes
          WHERE course_id = ? AND class_date = ?
          ORDER BY page_number ASC
        `).all(session.course_id, session.class_date);

        const isRevised = pages.some(p => p.is_revised === 1);

        return {
          ...session,
          hasNotes: pages.length > 0,
          pageCount: pages.length,
          isRevised,
          pages
        };
      });

      // Filter by search if provided
      let filteredSessions = sessions;
      if (search && search.trim()) {
        const term = search.toLowerCase().trim();
        filteredSessions = sessions.filter(s => 
          s.course_title.toLowerCase().includes(term) ||
          s.pages.some(p => p.title.toLowerCase().includes(term) || p.content.toLowerCase().includes(term))
        );
      }

      // Also get distinct list of student's past classes for requesting notes
      const pastClasses = db.prepare(`
        SELECT DISTINCT a.course_id, a.class_date, a.status, c.title AS course_title
        FROM attendance a
        JOIN courses c ON a.course_id = c.id
        WHERE a.student_id = ?
        ORDER BY a.class_date DESC
        LIMIT 30
      `).all(studentId);

      res.json({
        sessions: filteredSessions,
        pastClasses
      });
    } catch (err) {
      console.error('Student notes error:', err);
      res.status(500).json({ error: 'Failed to retrieve missed lecture notes' });
    }
  },

  requestNotes: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { course_id, class_date, topic } = req.body;

      if (!course_id || !class_date) {
        return res.status(400).json({ error: 'course_id and class_date are required' });
      }

      const course = db.prepare('SELECT title FROM courses WHERE id = ?').get(course_id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Generate 5 multi-page structured handwritten notes
      const pages = await aiService.generateMultiPageNotes(course.title, class_date, topic);

      // Insert pages into class_notes table
      for (const p of pages) {
        const existing = db.prepare(`
          SELECT id FROM class_notes WHERE course_id = ? AND class_date = ? AND page_number = ?
        `).get(course_id, class_date, p.page_number);

        if (existing) {
          db.prepare(`
            UPDATE class_notes 
            SET title = ?, content = ?, svg_diagram = ?, is_revised = 0
            WHERE id = ?
          `).run(p.title, p.content, p.svg_diagram || null, existing.id);
        } else {
          db.prepare(`
            INSERT INTO class_notes (course_id, class_date, title, content, page_number, svg_diagram, is_revised, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
          `).run(course_id, class_date, p.title, p.content, p.page_number, p.svg_diagram || null);
        }
      }

      res.json({
        success: true,
        message: `Successfully synthesized 5 handwritten notebook pages for ${course.title}!`,
        pages
      });
    } catch (err) {
      console.error('Request notes error:', err);
      res.status(500).json({ error: 'Failed to synthesize lecture notes' });
    }
  },

  toggleRevised: (req, res) => {
    try {
      const { course_id, class_date, page_id } = req.body;

      if (page_id) {
        db.prepare(`
          UPDATE class_notes
          SET is_revised = CASE WHEN is_revised = 1 THEN 0 ELSE 1 END
          WHERE id = ?
        `).run(page_id);
      } else if (course_id && class_date) {
        db.prepare(`
          UPDATE class_notes
          SET is_revised = CASE WHEN is_revised = 1 THEN 0 ELSE 1 END
          WHERE course_id = ? AND class_date = ?
        `).run(course_id, class_date);
      } else {
        return res.status(400).json({ error: 'page_id or course_id + class_date is required' });
      }

      res.json({ success: true, message: 'Revision status updated' });
    } catch (err) {
      console.error('Toggle revised error:', err);
      res.status(500).json({ error: 'Failed to update revision status' });
    }
  },

  getFacultyFeedback: (req, res) => {
    try {
      const studentId = req.user.id;
      const courses = db.prepare(`
        SELECT
          c.id AS course_id,
          c.title AS subject_name,
          c.teacher_id,
          u.name AS faculty_name,
          COALESCE((SELECT score FROM performance WHERE student_id = ? AND course_id = c.id ORDER BY updated_at DESC LIMIT 1), 0) AS academic_score,
          COALESCE((
            SELECT 100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)
            FROM attendance a
            WHERE a.student_id = ? AND a.course_id = c.id
          ), 0) AS attendance_percentage,
          (SELECT id FROM feedback WHERE student_id = ? AND course_id = c.id ORDER BY created_at DESC LIMIT 1) AS feedback_id,
          (SELECT rating FROM feedback WHERE student_id = ? AND course_id = c.id ORDER BY created_at DESC LIMIT 1) AS feedback_rating,
          (SELECT comment FROM feedback WHERE student_id = ? AND course_id = c.id ORDER BY created_at DESC LIMIT 1) AS feedback_comment,
          (SELECT created_at FROM feedback WHERE student_id = ? AND course_id = c.id ORDER BY created_at DESC LIMIT 1) AS feedback_created_at
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        LEFT JOIN users u ON u.id = c.teacher_id
        WHERE e.student_id = ?
        ORDER BY c.title ASC
      `).all(studentId, studentId, studentId, studentId, studentId, studentId, studentId);

      const subjects = courses.map(course => {
        const attendance = Number(course.attendance_percentage || 0);
        const academicScore = Number(course.academic_score || 0);
        const attendanceShortfall = attendance >= 75 ? 0 : Math.max(0, 75 - attendance);
        const scoreShortfall = academicScore >= 60 ? 0 : Math.max(0, 60 - academicScore);
        const isEligible = attendance >= 75 && academicScore >= 60;
        const hasSubmitted = Boolean(course.feedback_id);

        return {
          course_id: course.course_id,
          subject_code: `SUB-${String(course.course_id).padStart(3, '0')}`,
          subject_name: course.subject_name,
          faculty_name: course.faculty_name || 'Faculty Member',
          teacher_id: course.teacher_id,
          attendance_percentage: Number(attendance.toFixed(1)),
          academic_score: Number(academicScore.toFixed(1)),
          eligibility_status: hasSubmitted ? 'Feedback Submitted' : isEligible ? 'Eligible to Evaluate Faculty' : 'Ineligible to Evaluate Faculty',
          is_eligible: isEligible,
          is_submitted: hasSubmitted,
          attendance_shortfall: Number(attendanceShortfall.toFixed(1)),
          score_shortfall: Number(scoreShortfall.toFixed(1)),
          shortfall_message: !isEligible
            ? `Needs ${attendanceShortfall > 0 ? `${attendanceShortfall.toFixed(1)}% more attendance` : 'attendance requirement met'}${attendanceShortfall > 0 && scoreShortfall > 0 ? ' and ' : ''}${scoreShortfall > 0 ? `${scoreShortfall.toFixed(1)}% more academic score` : 'score requirement met'} to unlock feedback.`
            : '',
          feedback: hasSubmitted ? {
            id: course.feedback_id,
            rating: course.feedback_rating,
            comment: course.feedback_comment,
            created_at: course.feedback_created_at
          } : null
        };
      });

      res.json({ subjects });
    } catch (err) {
      console.error('Get faculty feedback eligibility error:', err);
      res.status(500).json({ error: 'Failed to retrieve faculty evaluation eligibility' });
    }
  },

  submitFacultyFeedback: (req, res) => {
    try {
      const studentId = req.user.id;
      const { course_id, teacher_id, rating, comment } = req.body;

      if (!course_id || !teacher_id) {
        return res.status(400).json({ error: 'course_id and teacher_id are required' });
      }

      const course = db.prepare('SELECT id, title, teacher_id FROM courses WHERE id = ?').get(course_id);
      if (!course) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      const attendanceRow = db.prepare(`
        SELECT COALESCE(100.0 * SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*), 0) AS attendance_percentage
        FROM attendance
        WHERE student_id = ? AND course_id = ?
      `).get(studentId, course_id);

      const performanceRow = db.prepare(`
        SELECT COALESCE(score, 0) AS academic_score
        FROM performance
        WHERE student_id = ? AND course_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
      `).get(studentId, course_id);

      const attendancePercentage = Number(attendanceRow?.attendance_percentage || 0);
      const academicScore = Number(performanceRow?.academic_score || 0);
      const finalRating = Number(rating || 5);
      const sanitizedComment = (comment || '').trim();
      const isEligible = attendancePercentage >= 75 && academicScore >= 60;

      if (!isEligible) {
        return res.status(400).json({
          error: 'Feedback is locked until your attendance and academic score meet the evaluation thresholds.',
          attendance_percentage: attendancePercentage,
          academic_score: academicScore,
          required_attendance: 75,
          required_score: 60,
          attendance_shortfall: Math.max(0, 75 - attendancePercentage),
          score_shortfall: Math.max(0, 60 - academicScore)
        });
      }

      const existing = db.prepare(`
        SELECT id FROM feedback
        WHERE student_id = ? AND course_id = ?
        LIMIT 1
      `).get(studentId, course_id);

      if (existing) {
        return res.status(409).json({ error: 'You have already submitted faculty feedback for this subject.' });
      }

      if (!sanitizedComment) {
        return res.status(400).json({ error: 'Please add a short comment about the faculty feedback.' });
      }

      db.prepare(`
        INSERT INTO feedback (student_id, teacher_id, course_id, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(studentId, teacher_id || course.teacher_id, course_id, Math.min(5, Math.max(1, finalRating)), sanitizedComment);

      const coinResult = coinService.awardCoins(
        studentId,
        25,
        `Faculty feedback for ${course.title}`,
        `faculty-feedback:${studentId}:${course_id}`
      );

      if (!coinResult.awarded && !coinResult.alreadyAwarded) {
        console.warn('Faculty feedback award skipped:', coinResult);
      }

      const review = db.prepare(`
        SELECT f.id, f.rating, f.comment, f.created_at, u.name AS faculty_name
        FROM feedback f
        JOIN users u ON u.id = f.teacher_id
        WHERE f.student_id = ? AND f.course_id = ?
        ORDER BY f.created_at DESC
        LIMIT 1
      `).get(studentId, course_id);

      return res.status(201).json({
        success: true,
        message: `Feedback submitted successfully. +25 Spark Coins awarded for ${course.title}.`,
        coinAwarded: coinResult.awarded || coinResult.alreadyAwarded,
        review
      });
    } catch (err) {
      console.error('Submit faculty feedback error:', err);
      return res.status(500).json({ error: 'Failed to submit faculty feedback' });
    }
  },

  getCoins: (req, res) => {
    try {
      const studentId = req.user.id;
      const balance = coinService.getBalance(studentId);
      const history = coinService.getHistory(studentId);

      res.json({
        balance,
        history
      });
    } catch (err) {
      console.error('Student coins error:', err);
      res.status(500).json({ error: 'Failed to retrieve coins balance' });
    }
  },

  getRiskStatus: (req, res) => {
    try {
      const studentId = req.user.id;

      // 1. Attendance Metrics
      const attRow = db.prepare(`
        SELECT 
          COUNT(*) AS total_classes,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count
        FROM attendance
        WHERE student_id = ?
      `).get(studentId);

      const totalClasses = attRow?.total_classes || 0;
      const presentClasses = attRow?.present_count || 0;
      const absentClasses = attRow?.absent_count || 0;
      const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;
      
      // Calculate how many consecutive classes to attend to reach 80%
      let classesNeededFor80 = 0;
      if (attendanceRate < 80 && totalClasses > 0) {
        classesNeededFor80 = Math.max(1, Math.ceil(4 * totalClasses - 5 * presentClasses));
      }

      // 2. Mock Tests Metrics (40%)
      const testRow = db.prepare(`
        SELECT AVG(score) AS avg_score, COUNT(*) AS count
        FROM test_attempts
        WHERE student_id = ?
      `).get(studentId);
      const testAvg = (testRow && testRow.count > 0 && testRow.avg_score !== null)
        ? Math.round(testRow.avg_score)
        : 70;
      const testsCount = testRow?.count || 0;

      // 3. Coding Problem Accuracy & Practice (25%)
      const subRow = db.prepare(`
        SELECT 
          COUNT(*) AS total_submissions,
          SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) AS accepted_submissions,
          AVG(CASE WHEN total > 0 THEN (CAST(passed AS REAL) / total) * 100 ELSE 0 END) AS avg_pass_rate
        FROM submissions
        WHERE student_id = ?
      `).get(studentId);
      const codingAccuracy = (subRow && subRow.total_submissions > 0)
        ? Math.round(subRow.avg_pass_rate || ((subRow.accepted_submissions / subRow.total_submissions) * 100))
        : 65;
      const problemsSolved = subRow?.accepted_submissions || 0;

      // 4. Course Lesson Progress (20%)
      const courseRow = db.prepare(`
        SELECT AVG(progress_percent) AS avg_progress, COUNT(*) AS count
        FROM enrollments
        WHERE student_id = ?
      `).get(studentId);
      const courseProgress = (courseRow && courseRow.count > 0 && courseRow.avg_progress !== null)
        ? Math.round(courseRow.avg_progress)
        : 60;
      const enrolledCoursesCount = courseRow?.count || 0;

      // 5. Overall Weighted Standing (40/25/20/15)
      const standing = Math.min(100, Math.max(0, Math.round(
        (testAvg * 0.40) +
        (codingAccuracy * 0.25) +
        (courseProgress * 0.20) +
        (attendanceRate * 0.15)
      )));

      // 6. Risk Level Categorization
      let riskLevel = 'good'; // 'critical', 'moderate', 'good', 'honors'
      let riskTitle = 'Good Standing';
      let riskColor = 'emerald';

      if (attendanceRate < 75 || standing < 65) {
        riskLevel = 'critical';
        riskTitle = 'Critical Academic Risk';
        riskColor = 'rose';
      } else if (attendanceRate < 80 || standing < 75) {
        riskLevel = 'moderate';
        riskTitle = 'Moderate Risk — Intervention Required';
        riskColor = 'amber';
      } else if (standing >= 85 && attendanceRate >= 90) {
        riskLevel = 'honors';
        riskTitle = 'Academic Honors & Safe Standing';
        riskColor = 'indigo';
      }

      // 7. Subject-Specific Risk Matrix
      const subjects = db.prepare(`
        SELECT 
          c.id AS course_id,
          c.title AS subject_name,
          COALESCE((SELECT score FROM performance WHERE student_id = ? AND course_id = c.id ORDER BY updated_at DESC LIMIT 1), 0) AS score,
          COALESCE((
            SELECT ROUND(100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*))
            FROM attendance a
            WHERE a.student_id = ? AND a.course_id = c.id
          ), 100) AS attendance,
          e.progress_percent
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
        ORDER BY c.title ASC
      `).all(studentId, studentId, studentId).map(sub => {
        let status = 'on_track';
        if (sub.attendance < 75 || sub.score < 60) status = 'critical';
        else if (sub.attendance < 80 || sub.score < 70) status = 'needs_attention';
        return {
          ...sub,
          status
        };
      });

      // 8. Unrevised Missed Notes Count
      const unrevisedNotes = db.prepare(`
        SELECT COUNT(*) AS count
        FROM class_notes cn
        JOIN attendance a ON a.course_id = cn.course_id AND a.class_date = cn.class_date
        WHERE a.student_id = ? AND a.status = 'absent' AND cn.is_revised = 0
      `).get(studentId)?.count || 0;

      // 9. Concrete Recovery Action Plan
      const recoveryPlan = [
        {
          id: 'attendance',
          priority: attendanceRate < 80 ? 'high' : 'medium',
          pillar: 'Class Attendance (15% Weight)',
          current: `${attendanceRate}%`,
          target: '80% Institutional Minimum',
          action: absentClasses > 0
            ? `Attend next ${classesNeededFor80} consecutive lectures without absence and review ${unrevisedNotes} unrevised handwritten lecture notes.`
            : 'Maintain current attendance consistency.',
          link: '/student/notes',
          linkLabel: 'Review Missed Lecture Notes',
          pointGain: attendanceRate < 80 ? `+${((80 - attendanceRate) * 0.15).toFixed(1)}%` : '+0%'
        },
        {
          id: 'tests',
          priority: testAvg < 75 ? 'high' : 'medium',
          pillar: 'Mock Test Assessments (40% Weight - Highest Impact)',
          current: `${testAvg}%`,
          target: '85% Target Score',
          action: `Retake mock quizzes in weak subjects. A 10-point test increase directly boosts your overall standing by +4.0%.`,
          link: '/student/tests',
          linkLabel: 'Take Practice Assessment',
          pointGain: testAvg < 85 ? `+${((85 - testAvg) * 0.40).toFixed(1)}%` : '+0%'
        },
        {
          id: 'coding',
          priority: codingAccuracy < 75 ? 'high' : 'low',
          pillar: 'Coding Arena Practice (25% Weight)',
          current: `${codingAccuracy}% (${problemsSolved} Solved)`,
          target: '80% Acceptance Rate (15+ Solved)',
          action: 'Complete 3-5 beginner/intermediate algorithms in the practice arena to increase submission accuracy and earn bonus coins.',
          link: '/student/practice',
          linkLabel: 'Solve Practice Problems',
          pointGain: codingAccuracy < 80 ? `+${((80 - codingAccuracy) * 0.25).toFixed(1)}%` : '+0%'
        },
        {
          id: 'lessons',
          priority: courseProgress < 75 ? 'medium' : 'low',
          pillar: 'Course Lesson Completion (20% Weight)',
          current: `${courseProgress}%`,
          target: '85% Course Completion',
          action: 'Finish pending lesson reading modules and take end-of-module quizzes (+5 coins per lesson completion).',
          link: '/student/courses',
          linkLabel: 'Resume Enrolled Courses',
          pointGain: courseProgress < 85 ? `+${((85 - courseProgress) * 0.20).toFixed(1)}%` : '+0%'
        },
        {
          id: 'mentor',
          priority: riskLevel !== 'good' && riskLevel !== 'honors' ? 'high' : 'medium',
          pillar: 'AI Remedial Mentorship',
          current: riskLevel !== 'good' ? 'Needs Guidance' : 'Aligned',
          target: 'Custom 7-Day Recovery Plan',
          action: 'Prompt the AI Mentor with your low-scoring subjects to receive personalized flashcards, summary explanations, and study schedules.',
          link: '/student/ai-assistant',
          linkLabel: 'Consult AI Mentor',
          pointGain: 'Remedial Mastery'
        }
      ];

      res.json({
        standing,
        riskLevel,
        riskTitle,
        riskColor,
        attendanceRate,
        totalClasses,
        presentClasses,
        absentClasses,
        classesNeededFor80,
        unrevisedNotes,
        breakdown: {
          tests: { score: testAvg, count: testsCount, weight: '40%' },
          coding: { accuracy: codingAccuracy, solved: problemsSolved, weight: '25%' },
          courseProgress: { progress: courseProgress, count: enrolledCoursesCount, weight: '20%' },
          attendance: { rate: attendanceRate, present: presentClasses, total: totalClasses, weight: '15%' }
        },
        subjects,
        recoveryPlan
      });
    } catch (err) {
      console.error('Student risk status error:', err);
      res.status(500).json({ error: 'Failed to compute student risk status' });
    }
  }
};

module.exports = studentController;
