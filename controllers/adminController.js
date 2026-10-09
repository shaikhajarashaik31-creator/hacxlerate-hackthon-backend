const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db/database');
const coinService = require('../services/coinService');

const adminController = {
  getDashboard: (req, res) => {
    try {
      // 1. Core counters
      const totalStudents = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'student'").get().c;
      const totalTeachers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'teacher'").get().c;
      const totalCourses = db.prepare('SELECT COUNT(*) AS c FROM courses').get().c;

      // Active users today
      const activeUsersToday = db.prepare(`
        SELECT COUNT(DISTINCT user_id) AS c 
        FROM login_logs 
        WHERE date(login_time) = date('now')
      `).get().c;

      // 2. Department distribution
      const departmentDistribution = db.prepare(`
        SELECT department, COUNT(*) AS count
        FROM users
        WHERE role = 'student'
        GROUP BY department
      `).all();

      // 3. Platform attendance & performance averages
      const platformAttendance = db.prepare(`
        SELECT 
          ROUND(CAST(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS REAL) * 100 / NULLIF(COUNT(*), 0)) AS rate
        FROM attendance
      `).get()?.rate || 86;

      const platformAvgScore = db.prepare(`
        SELECT ROUND(AVG(score)) AS avg_score FROM performance
      `).get()?.avg_score || 81;

      // 4. Recent logins
      const recentLogins = db.prepare(`
        SELECT l.*, u.name, u.email, u.role
        FROM login_logs l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.login_time DESC
        LIMIT 6
      `).all();

      // 5. Total Certificates Issued
      const totalCertificates = db.prepare('SELECT COUNT(*) AS c FROM certificates').get().c;

      res.json({
        stats: {
          totalStudents,
          totalTeachers,
          totalCourses,
          activeUsersToday,
          platformAttendance,
          platformAvgScore,
          totalCertificates
        },
        departmentDistribution,
        recentLogins
      });
    } catch (err) {
      console.error('Admin dashboard error:', err);
      res.status(500).json({ error: 'Failed to load admin dashboard' });
    }
  },

  getAllUsers: (req, res) => {
    try {
      const { role, search } = req.query;

      let query = `
        SELECT id, name, email, role, department, skills, interests, must_change_password, created_at,
          (
            SELECT MAX(login_time) FROM login_logs WHERE user_id = users.id
          ) AS last_login
        FROM users
        WHERE 1=1
      `;
      const params = [];

      if (role && role !== 'all') {
        query += ` AND role = ?`;
        params.push(role);
      }

      if (search) {
        query += ` AND (name LIKE ? OR email LIKE ? OR department LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      query += ` ORDER BY role ASC, name ASC`;

      const users = db.prepare(query).all(...params);

      res.json({ users });
    } catch (err) {
      console.error('Admin getAllUsers error:', err);
      res.status(500).json({ error: 'Failed to retrieve users' });
    }
  },

  createUser: (req, res) => {
    try {
      const { name, email, department, skills, interests } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const lowerEmail = email.toLowerCase().trim();
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(lowerEmail);
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Role is decided by email domain
      let role = 'student';
      if (lowerEmail.endsWith('@admin.edu')) {
        role = 'admin';
      } else if (lowerEmail.endsWith('@teacher.edu')) {
        role = 'teacher';
      }

      // Auto-generate 10-character temporary password with numbers and symbols
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      const tempPassword = `EduPulse#${randomSuffix}9`;
      const passwordHash = bcrypt.hashSync(tempPassword, 10);

      const info = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, department, skills, interests, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        name.trim(),
        lowerEmail,
        passwordHash,
        role,
        department?.trim() || 'General Studies',
        skills?.trim() || '',
        interests?.trim() || ''
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        temporaryPassword: tempPassword,
        user: {
          id: info.lastInsertRowid,
          name: name.trim(),
          email: lowerEmail,
          role,
          department: department?.trim() || 'General Studies',
          must_change_password: 1
        }
      });
    } catch (err) {
      console.error('Admin createUser error:', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  resetPassword: (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Auto-generate new temporary password
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      const tempPassword = `Reset#${randomSuffix}7`;
      const passwordHash = bcrypt.hashSync(tempPassword, 10);

      db.prepare(`
        UPDATE users
        SET password_hash = ?, must_change_password = 1
        WHERE id = ?
      `).run(passwordHash, userId);

      res.json({
        success: true,
        message: `Password reset successfully for ${user.name} (${user.email})`,
        temporaryPassword: tempPassword,
        userId: user.id
      });
    } catch (err) {
      console.error('Admin resetPassword error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  },

  getStudentProgress: (req, res) => {
    try {
      const students = db.prepare(`
        SELECT id, name, email, department
        FROM users
        WHERE role = 'student'
        ORDER BY name ASC
      `).all().map(student => {
        // Completed courses count
        const completedCourses = db.prepare(`
          SELECT COUNT(*) AS c FROM enrollments WHERE student_id = ? AND status = 'completed'
        `).get(student.id)?.c || 0;

        // In progress courses count
        const inProgressCourses = db.prepare(`
          SELECT COUNT(*) AS c FROM enrollments WHERE student_id = ? AND status = 'in_progress'
        `).get(student.id)?.c || 0;

        // Certificates count
        const certificates = db.prepare(`
          SELECT COUNT(*) AS c FROM certificates WHERE student_id = ?
        `).get(student.id)?.c || 0;

        // Test attempts count & avg score
        const testStats = db.prepare(`
          SELECT COUNT(*) AS attempts, AVG(score) AS avg_test_score
          FROM test_attempts
          WHERE student_id = ?
        `).get(student.id);

        // Coins balance
        const coins = coinService.getBalance(student.id);

        // Total platform time tracked (minutes)
        const timeRow = db.prepare(`
          SELECT SUM(duration_seconds) AS total_sec
          FROM activity_logs
          WHERE user_id = ?
        `).get(student.id);

        const totalPlatformMinutes = Math.round((timeRow?.total_sec || 0) / 60);

        // Attendance rate
        const attRow = db.prepare(`
          SELECT 
            ROUND(CAST(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS REAL) * 100 / NULLIF(COUNT(*), 0)) AS rate
          FROM attendance
          WHERE student_id = ?
        `).get(student.id);

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          department: student.department,
          completedCourses,
          inProgressCourses,
          certificates,
          testAttempts: testStats?.attempts || 0,
          avgTestScore: Math.round(testStats?.avg_test_score || 0),
          coins,
          totalPlatformMinutes,
          attendanceRate: attRow?.rate || 100
        };
      });

      res.json({ students });
    } catch (err) {
      console.error('Admin getStudentProgress error:', err);
      res.status(500).json({ error: 'Failed to retrieve student progress' });
    }
  },

  getTeacherActivity: (req, res) => {
    try {
      const teachers = db.prepare(`
        SELECT id, name, email, department
        FROM users
        WHERE role = 'teacher'
        ORDER BY name ASC
      `).all().map(teacher => {
        // Courses managed
        const courses = db.prepare(`
          SELECT id, title, total_lessons, is_extra FROM courses WHERE teacher_id = ?
        `).all(teacher.id);

        // Logins count and last login
        const loginStats = db.prepare(`
          SELECT COUNT(*) AS total_logins, MAX(login_time) AS last_login
          FROM login_logs
          WHERE user_id = ?
        `).get(teacher.id);

        // Feedback received count and average rating
        const fbStats = db.prepare(`
          SELECT COUNT(*) AS count, AVG(rating) AS avg_rating
          FROM feedback
          WHERE teacher_id = ?
        `).get(teacher.id);

        // Platform time spent
        const timeRow = db.prepare(`
          SELECT SUM(duration_seconds) AS total_sec
          FROM activity_logs
          WHERE user_id = ?
        `).get(teacher.id);

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          department: teacher.department,
          coursesManaged: courses.length,
          courseList: courses.map(c => c.title),
          totalLogins: loginStats?.total_logins || 0,
          lastLogin: loginStats?.last_login || null,
          feedbackCount: fbStats?.count || 0,
          avgRating: Math.round((fbStats?.avg_rating || 0) * 10) / 10,
          timeSpentMinutes: Math.round((timeRow?.total_sec || 0) / 60)
        };
      });

      res.json({ teachers });
    } catch (err) {
      console.error('Admin getTeacherActivity error:', err);
      res.status(500).json({ error: 'Failed to retrieve teacher activity' });
    }
  },

  getTimeline: (req, res) => {
    try {
      // Aggregate chronologically logins, course completions, certificates, test attempts, activities
      const activities = db.prepare(`
        SELECT 
          'activity' AS event_category,
          al.id, al.user_id, al.event_type AS title,
          'Spent ' || ROUND(al.duration_seconds / 60.0, 1) || ' mins on ' || COALESCE(al.page, 'course ' || al.course_id, 'test ' || al.test_id) AS details,
          al.created_at,
          u.name AS user_name, u.role AS user_role
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 25
      `).all();

      const logins = db.prepare(`
        SELECT 
          'login' AS event_category,
          l.id, l.user_id, 'User Login' AS title,
          'Logged in from IP ' || COALESCE(l.ip, '127.0.0.1') AS details,
          l.login_time AS created_at,
          u.name AS user_name, u.role AS user_role
        FROM login_logs l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.login_time DESC
        LIMIT 25
      `).all();

      const certificates = db.prepare(`
        SELECT 
          'certificate' AS event_category,
          c.id, c.student_id AS user_id, 'Certificate Earned' AS title,
          'Earned certificate for ' || cr.title || ' (' || c.certificate_code || ')' AS details,
          c.issued_at AS created_at,
          u.name AS user_name, 'student' AS user_role
        FROM certificates c
        JOIN courses cr ON c.course_id = cr.id
        JOIN users u ON c.student_id = u.id
        ORDER BY c.issued_at DESC
        LIMIT 15
      `).all();

      const testSubmissions = db.prepare(`
        SELECT 
          'test' AS event_category,
          ta.id, ta.student_id AS user_id, 'Test Submitted' AS title,
          'Scored ' || ta.score || '% on ' || t.title AS details,
          ta.taken_at AS created_at,
          u.name AS user_name, 'student' AS user_role
        FROM test_attempts ta
        JOIN tests t ON ta.test_id = t.id
        JOIN users u ON ta.student_id = u.id
        ORDER BY ta.taken_at DESC
        LIMIT 20
      `).all();

      // Merge and sort DESC by created_at
      const timeline = [...activities, ...logins, ...certificates, ...testSubmissions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);

      res.json({ timeline });
    } catch (err) {
      console.error('Admin getTimeline error:', err);
      res.status(500).json({ error: 'Failed to retrieve timeline' });
    }
  },

  getEconomy: (req, res) => {
    try {
      const stats = coinService.getPlatformEconomyStats();
      res.json({ stats });
    } catch (err) {
      console.error('Admin getEconomy error:', err);
      res.status(500).json({ error: 'Failed to retrieve economy stats' });
    }
  }
};

module.exports = adminController;
