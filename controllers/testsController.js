const db = require('../db/database');
const coinService = require('../services/coinService');
const performanceService = require('../services/performanceService');

const testsController = {
  getAllTests: (req, res) => {
    try {
      const studentId = req.user?.id;

      const tests = db.prepare(`
        SELECT 
          t.*,
          c.title AS course_title,
          COUNT(q.id) AS question_count,
          MAX(ta.score) AS highest_score,
          MAX(ta.taken_at) AS last_attempt_at
        FROM tests t
        LEFT JOIN courses c ON t.course_id = c.id
        LEFT JOIN questions q ON t.id = q.test_id
        LEFT JOIN test_attempts ta ON t.id = ta.test_id AND ta.student_id = ?
        GROUP BY t.id
        ORDER BY t.id ASC
      `).all(studentId || null);

      res.json({ tests });
    } catch (err) {
      console.error('Get all tests error:', err);
      res.status(500).json({ error: 'Failed to retrieve mock tests' });
    }
  },

  getTestById: (req, res) => {
    try {
      const testId = req.params.id;
      const test = db.prepare(`
        SELECT t.*, c.title AS course_title
        FROM tests t
        LEFT JOIN courses c ON t.course_id = c.id
        WHERE t.id = ?
      `).get(testId);

      if (!test) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const questions = db.prepare(`
        SELECT id, question, option_a, option_b, option_c, option_d
        FROM questions
        WHERE test_id = ?
        ORDER BY id ASC
      `).all(testId);

      res.json({
        test,
        questions
      });
    } catch (err) {
      console.error('Get test by id error:', err);
      res.status(500).json({ error: 'Failed to retrieve test details' });
    }
  },

  submitTest: (req, res) => {
    try {
      const studentId = req.user.id;
      const testId = parseInt(req.params.id, 10);
      const { answers = {}, time_taken_seconds = 0 } = req.body;

      const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(testId);
      if (!test) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const questions = db.prepare(`
        SELECT id, question, option_a, option_b, option_c, option_d, correct_option
        FROM questions
        WHERE test_id = ?
        ORDER BY id ASC
      `).all(testId);

      if (questions.length === 0) {
        return res.status(400).json({ error: 'Test contains no questions' });
      }

      let correctCount = 0;
      const review = questions.map((q) => {
        const studentChoice = answers[q.id] || answers[String(q.id)] || null;
        const isCorrect = studentChoice && studentChoice.toUpperCase() === q.correct_option.toUpperCase();
        if (isCorrect) correctCount++;

        return {
          id: q.id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          student_choice: studentChoice,
          is_correct: !!isCorrect
        };
      });

      const score = Math.round((correctCount / questions.length) * 100);

      // Record test attempt
      db.prepare(`
        INSERT INTO test_attempts (student_id, test_id, score, time_taken_seconds, taken_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(studentId, testId, score, time_taken_seconds);

      // Award coins (mock test completed +10, plus +20 for score >= 80%)
      const attemptTimestamp = Date.now();
      let coinsEarned = 10;
      coinService.awardCoins(studentId, 10, `Completed Mock Test: ${test.title}`, `test_${testId}_${studentId}_${attemptTimestamp}`);

      if (score >= 80) {
        coinService.awardCoins(studentId, 20, `High score (${score}%) on: ${test.title}`, `test_bonus_${testId}_${studentId}_${attemptTimestamp}`);
        coinsEarned += 20;
      }

      // Automatically recalculate weighted student performance
      performanceService.recalcPerformance(studentId);

      res.json({
        score,
        correctCount,
        totalQuestions: questions.length,
        time_taken_seconds,
        coinsEarned,
        newBalance: coinService.getBalance(studentId),
        review
      });
    } catch (err) {
      console.error('Submit test error:', err);
      res.status(500).json({ error: 'Failed to submit test' });
    }
  }
};

module.exports = testsController;
