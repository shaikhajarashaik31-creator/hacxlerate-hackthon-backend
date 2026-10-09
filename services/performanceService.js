const db = require('../db/database');

const performanceService = {
  /**
   * Recalculates student performance dynamically using the 40/25/20/15 weighted formula
   * 40% mock test average
   * 25% coding problem accuracy
   * 20% course progress
   * 15% attendance
   */
  recalcPerformance: (studentId) => {
    try {
      // 1. Mock test average (40%)
      const testRow = db.prepare(`
        SELECT AVG(score) AS avg_score, COUNT(*) AS count
        FROM test_attempts
        WHERE student_id = ?
      `).get(studentId);
      const testAvg = (testRow && testRow.count > 0 && testRow.avg_score !== null)
        ? Math.round(testRow.avg_score)
        : 75; // Baseline default if not taken yet

      // 2. Coding problem accuracy (25%)
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
        : 70; // Baseline default

      // 3. Course progress (20%)
      const courseRow = db.prepare(`
        SELECT AVG(progress_percent) AS avg_progress, COUNT(*) AS count
        FROM enrollments
        WHERE student_id = ?
      `).get(studentId);
      const courseProgress = (courseRow && courseRow.count > 0 && courseRow.avg_progress !== null)
        ? Math.round(courseRow.avg_progress)
        : 65;

      // 4. Attendance (15%)
      const attRow = db.prepare(`
        SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present
        FROM attendance
        WHERE student_id = ?
      `).get(studentId);
      const attendanceRate = (attRow && attRow.total > 0)
        ? Math.round((attRow.present / attRow.total) * 100)
        : 85;

      // Weighted combination
      const weightedScore = Math.min(100, Math.max(0, Math.round(
        (testAvg * 0.40) +
        (codingAccuracy * 0.25) +
        (courseProgress * 0.20) +
        (attendanceRate * 0.15)
      )));

      // Update performance table for student's enrolled courses
      const enrollments = db.prepare('SELECT course_id FROM enrollments WHERE student_id = ?').all(studentId);
      for (const en of enrollments) {
        const perfExists = db.prepare('SELECT id FROM performance WHERE student_id = ? AND course_id = ?').get(studentId, en.course_id);
        if (perfExists) {
          db.prepare('UPDATE performance SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(weightedScore, perfExists.id);
        } else {
          db.prepare('INSERT INTO performance (student_id, course_id, score, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(studentId, en.course_id, weightedScore);
        }
      }

      // Record in performance_history for trend line charts
      db.prepare(`
        INSERT INTO performance_history (student_id, score, test_part, coding_part, course_part, attendance_part, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(studentId, weightedScore, testAvg, codingAccuracy, courseProgress, attendanceRate);

      return {
        studentId,
        score: weightedScore,
        breakdown: {
          testAvg,
          codingAccuracy,
          courseProgress,
          attendanceRate
        },
        weights: {
          test: '40%',
          coding: '25%',
          course: '20%',
          attendance: '15%'
        }
      };
    } catch (err) {
      console.error(`recalcPerformance error for student ${studentId}:`, err);
      return null;
    }
  },

  /**
   * Retrieve performance trend history for trend charts
   */
  getPerformanceTrend: (studentId) => {
    return db.prepare(`
      SELECT id, score, test_part, coding_part, course_part, attendance_part, created_at
      FROM performance_history
      WHERE student_id = ?
      ORDER BY id ASC
      LIMIT 30
    `).all(studentId);
  }
};

module.exports = performanceService;
