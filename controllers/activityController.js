const db = require('../db/database');

const activityController = {
  trackActivity: (req, res) => {
    try {
      const userId = req.user.id;
      const {
        page = null,
        course_id = null,
        test_id = null,
        event_type = 'page_view',
        duration_seconds = 30
      } = req.body;

      const validEvents = ['page_view', 'course_time', 'test_time'];
      const sanitizedType = validEvents.includes(event_type) ? event_type : 'page_view';
      const sanitizedDuration = Math.max(1, Math.min(3600, parseInt(duration_seconds, 10) || 30));

      db.prepare(`
        INSERT INTO activity_logs (user_id, page, course_id, test_id, event_type, duration_seconds, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(userId, page, course_id ? parseInt(course_id, 10) : null, test_id ? parseInt(test_id, 10) : null, sanitizedType, sanitizedDuration);

      res.json({ success: true });
    } catch (err) {
      console.error('Track activity error:', err);
      res.status(500).json({ error: 'Failed to record activity log' });
    }
  },

  getSummary: (req, res) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      // 1. Total platform time for user
      const totalSecondsRow = db.prepare(`
        SELECT COALESCE(SUM(duration_seconds), 0) AS total_sec
        FROM activity_logs
        WHERE user_id = ?
      `).get(userId);

      const totalMinutes = Math.round((totalSecondsRow.total_sec || 0) / 60);

      // 2. Breakdown by event type
      const eventTypeBreakdown = db.prepare(`
        SELECT event_type, ROUND(SUM(duration_seconds) / 60.0, 1) AS minutes
        FROM activity_logs
        WHERE user_id = ?
        GROUP BY event_type
      `).all(userId);

      // 3. Last 7 days daily time
      const dailyTrend = db.prepare(`
        SELECT 
          date(created_at) AS log_date,
          ROUND(SUM(duration_seconds) / 60.0, 1) AS minutes
        FROM activity_logs
        WHERE user_id = ? AND created_at >= date('now', '-7 days')
        GROUP BY date(created_at)
        ORDER BY log_date ASC
      `).all(userId);

      // 4. Course time breakdown
      const courseTime = db.prepare(`
        SELECT 
          c.title AS course_title,
          ROUND(SUM(al.duration_seconds) / 60.0, 1) AS minutes
        FROM activity_logs al
        JOIN courses c ON al.course_id = c.id
        WHERE al.user_id = ?
        GROUP BY c.id, c.title
        ORDER BY minutes DESC
      `).all(userId);

      // 5. Test time breakdown
      const testTime = db.prepare(`
        SELECT 
          t.title AS test_title,
          ROUND(SUM(al.duration_seconds) / 60.0, 1) AS minutes
        FROM activity_logs al
        JOIN tests t ON al.test_id = t.id
        WHERE al.user_id = ?
        GROUP BY t.id, t.title
        ORDER BY minutes DESC
      `).all(userId);

      res.json({
        totalMinutes,
        eventTypeBreakdown,
        dailyTrend,
        courseTime,
        testTime
      });
    } catch (err) {
      console.error('Activity summary error:', err);
      res.status(500).json({ error: 'Failed to retrieve activity summary' });
    }
  }
};

module.exports = activityController;
