const db = require('../db/database');
const judge0Service = require('../services/judge0Service');
const coinService = require('../services/coinService');
const performanceService = require('../services/performanceService');

const practiceController = {
  /**
   * List all practice arena problems with filters & solve status
   */
  getProblems: (req, res) => {
    try {
      const studentId = req.user?.id;
      const { difficulty, topic, search } = req.query;

      let query = `
        SELECT 
          p.id, p.title, p.slug, p.difficulty, p.topic, p.created_at,
          (
            SELECT COUNT(*) FROM submissions s 
            WHERE s.problem_id = p.id AND s.status = 'Accepted'
          ) AS total_accepted,
          (
            SELECT COUNT(*) FROM submissions s 
            WHERE s.problem_id = p.id
          ) AS total_submissions,
          (
            SELECT COUNT(*) FROM submissions s 
            WHERE s.problem_id = p.id AND s.student_id = ? AND s.status = 'Accepted'
          ) AS is_solved
        FROM problems p
        WHERE 1=1
      `;
      const params = [studentId || null];

      if (difficulty && difficulty !== 'All') {
        query += ` AND p.difficulty = ?`;
        params.push(difficulty);
      }

      if (topic && topic !== 'All') {
        query += ` AND p.topic = ?`;
        params.push(topic);
      }

      if (search) {
        query += ` AND (p.title LIKE ? OR p.topic LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s);
      }

      query += ` ORDER BY p.id ASC`;

      const rows = db.prepare(query).all(...params);

      const problems = rows.map(p => {
        const total = p.total_submissions || 0;
        const accepted = p.total_accepted || 0;
        const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 85;

        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty,
          topic: p.topic,
          isSolved: Boolean(p.is_solved > 0),
          acceptanceRate,
          totalSubmissions: total
        };
      });

      // Get distinct topics list for category filters
      const topics = db.prepare('SELECT DISTINCT topic FROM problems ORDER BY topic ASC').all().map(r => r.topic);

      res.json({ problems, topics });
    } catch (err) {
      console.error('Get practice problems error:', err);
      res.status(500).json({ error: 'Failed to retrieve coding problems' });
    }
  },

  /**
   * Get single problem with details, examples, starter code
   */
  getProblemById: (req, res) => {
    try {
      const studentId = req.user?.id;
      const { id } = req.params;

      const problem = db.prepare('SELECT * FROM problems WHERE id = ? OR slug = ?').get(id, id);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      const testCases = db.prepare(`
        SELECT id, input, expected_output 
        FROM test_cases 
        WHERE problem_id = ? AND is_hidden = 0
        ORDER BY id ASC
      `).all(problem.id);

      const pastSubmissions = studentId ? db.prepare(`
        SELECT id, language, status, passed, total, runtime_ms, created_at
        FROM submissions
        WHERE problem_id = ? AND student_id = ?
        ORDER BY id DESC
        LIMIT 6
      `).all(problem.id, studentId) : [];

      const isSolved = studentId ? Boolean(db.prepare(`
        SELECT COUNT(*) AS c FROM submissions 
        WHERE problem_id = ? AND student_id = ? AND status = 'Accepted'
      `).get(problem.id, studentId)?.c > 0) : false;

      res.json({
        problem: {
          id: problem.id,
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          topic: problem.topic,
          description: problem.description,
          examples: JSON.parse(problem.examples_json || '[]'),
          constraints: JSON.parse(problem.constraints_json || '[]'),
          starterCode: JSON.parse(problem.starter_code_json || '{}'),
          isSolved
        },
        sampleTestCases: testCases,
        pastSubmissions
      });
    } catch (err) {
      console.error('Get problem details error:', err);
      res.status(500).json({ error: 'Failed to retrieve problem details' });
    }
  },

  /**
   * Run code against sample (visible) test cases
   */
  runSample: async (req, res) => {
    try {
      const { id } = req.params;
      const { language = 'javascript', code = '' } = req.body;

      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      const sampleCases = db.prepare(`
        SELECT id, input, expected_output 
        FROM test_cases 
        WHERE problem_id = ? AND is_hidden = 0
      `).all(id);

      if (sampleCases.length === 0) {
        // Fallback default sample run
        const exec = await judge0Service.runCode(language, code);
        return res.json({
          status: exec.status,
          allPassed: exec.status === 'Accepted',
          results: [{
            input: 'Default sample',
            expected: 'Expected output',
            actual: exec.stdout || exec.stderr,
            passed: exec.status === 'Accepted'
          }],
          runtime: exec.time
        });
      }

      const results = [];
      let allPassed = true;
      let totalTime = 0;

      for (const tc of sampleCases) {
        const start = Date.now();
        const exec = await judge0Service.runCode(language, code, tc.input);
        const elapsed = Date.now() - start;
        totalTime += elapsed;

        const actual = (exec.stdout || '').trim();
        const expected = (tc.expected_output || '').trim();

        const passed = exec.stderr ? false : (actual === expected || actual.includes(expected));
        if (!passed) allPassed = false;

        results.push({
          id: tc.id,
          input: tc.input,
          expected,
          actual: exec.stderr ? `Error: ${exec.stderr}` : actual,
          passed,
          runtimeMs: elapsed
        });
      }

      res.json({
        status: allPassed ? 'Accepted' : 'Wrong Answer',
        allPassed,
        results,
        runtimeMs: totalTime
      });
    } catch (err) {
      console.error('Run sample code error:', err);
      res.status(500).json({ error: 'Execution failed: ' + err.message });
    }
  },

  /**
   * Submit code against ALL test cases (including hidden)
   * Awards coins (+10 Easy, +25 Medium, +50 Hard) on first solve!
   * Recalculates weighted student performance.
   */
  submitProblem: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { id } = req.params;
      const { language = 'javascript', code = '' } = req.body;

      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(id);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      const allTestCases = db.prepare(`
        SELECT id, input, expected_output, is_hidden 
        FROM test_cases 
        WHERE problem_id = ?
        ORDER BY id ASC
      `).all(id);

      let passedCount = 0;
      let totalRuntime = 0;
      const testResults = [];

      for (const tc of allTestCases) {
        const start = Date.now();
        const exec = await judge0Service.runCode(language, code, tc.input);
        const elapsed = Date.now() - start;
        totalRuntime += elapsed;

        const actual = (exec.stdout || '').trim();
        const expected = (tc.expected_output || '').trim();
        const passed = exec.stderr ? false : (actual === expected || actual.includes(expected));

        if (passed) passedCount++;

        testResults.push({
          id: tc.id,
          isHidden: Boolean(tc.is_hidden),
          input: tc.is_hidden ? '[Hidden Case]' : tc.input,
          expected: tc.is_hidden ? '[Hidden]' : expected,
          actual: tc.is_hidden ? (passed ? '[Match]' : '[Mismatch]') : (exec.stderr ? `Error: ${exec.stderr}` : actual),
          passed,
          runtimeMs: elapsed
        });
      }

      const totalCount = allTestCases.length || 1;
      const isAccepted = passedCount === totalCount;
      const status = isAccepted ? 'Accepted' : (passedCount === 0 ? 'Wrong Answer' : 'Partially Accepted');

      // Record in submissions table
      const subInfo = db.prepare(`
        INSERT INTO submissions (student_id, problem_id, language, code, status, passed, total, runtime_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(studentId, problem.id, language, code, status, passedCount, totalCount, totalRuntime);

      let coinsAwarded = 0;
      let alreadySolvedBefore = false;

      // Handle coin award on first solve
      if (isAccepted) {
        const priorSolves = db.prepare(`
          SELECT COUNT(*) AS c FROM submissions 
          WHERE student_id = ? AND problem_id = ? AND status = 'Accepted' AND id != ?
        `).get(studentId, problem.id, subInfo.lastInsertRowid)?.c || 0;

        if (priorSolves === 0) {
          // First accepted submission!
          const rewardAmount = problem.difficulty === 'Hard' ? 50 : (problem.difficulty === 'Medium' ? 25 : 10);
          const awardResult = coinService.awardCoins(
            studentId,
            rewardAmount,
            `Solved ${problem.difficulty} problem: ${problem.title}`,
            `prob_solve_${studentId}_${problem.id}`
          );
          if (awardResult.awarded) {
            coinsAwarded = rewardAmount;
          }
        } else {
          alreadySolvedBefore = true;
        }

        // Trigger automatic performance recalculation
        performanceService.recalcPerformance(studentId);
      }

      res.json({
        submissionId: subInfo.lastInsertRowid,
        status,
        passed: passedCount,
        total: totalCount,
        runtimeMs: totalRuntime,
        isAccepted,
        coinsAwarded,
        alreadySolvedBefore,
        newBalance: coinService.getBalance(studentId),
        testResults
      });
    } catch (err) {
      console.error('Submit problem error:', err);
      res.status(500).json({ error: 'Submission evaluation failed: ' + err.message });
    }
  },

  /**
   * Get student practice statistics (streaks, charts, topic breakdown)
   */
  getStats: (req, res) => {
    try {
      const studentId = req.user.id;

      // Solved counts
      const solvedRow = db.prepare(`
        SELECT 
          COUNT(DISTINCT problem_id) AS total_solved
        FROM submissions
        WHERE student_id = ? AND status = 'Accepted'
      `).get(studentId);

      const totalProblems = db.prepare('SELECT COUNT(*) AS c FROM problems').get()?.c || 40;

      // Difficulty breakdown
      const diffRows = db.prepare(`
        SELECT p.difficulty, COUNT(DISTINCT s.problem_id) AS solved_count
        FROM problems p
        JOIN submissions s ON p.id = s.problem_id
        WHERE s.student_id = ? AND s.status = 'Accepted'
        GROUP BY p.difficulty
      `).all(studentId);

      const diffStats = {
        Easy: 0,
        Medium: 0,
        Hard: 0
      };
      diffRows.forEach(r => {
        if (diffStats[r.difficulty] !== undefined) {
          diffStats[r.difficulty] = r.solved_count;
        }
      });

      // Total available per difficulty
      const diffTotals = db.prepare(`
        SELECT difficulty, COUNT(*) AS count
        FROM problems
        GROUP BY difficulty
      `).all().reduce((acc, r) => {
        acc[r.difficulty] = r.count;
        return acc;
      }, { Easy: 0, Medium: 0, Hard: 0 });

      // Topic-wise progress chart data
      const topicChart = db.prepare(`
        SELECT 
          p.topic,
          COUNT(DISTINCT p.id) AS total,
          COUNT(DISTINCT CASE WHEN s.status = 'Accepted' THEN s.problem_id END) AS solved
        FROM problems p
        LEFT JOIN submissions s ON p.id = s.problem_id AND s.student_id = ?
        GROUP BY p.topic
        ORDER BY total DESC
      `).all(studentId);

      // Streak calculation (distinct days with submissions)
      const dates = db.prepare(`
        SELECT DISTINCT date(created_at) AS sub_date
        FROM submissions
        WHERE student_id = ?
        ORDER BY sub_date DESC
        LIMIT 30
      `).all(studentId).map(r => r.sub_date);

      let currentStreak = 0;
      if (dates.length > 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (dates[0] === todayStr || dates[0] === yesterday) {
          currentStreak = dates.length; // Simplified active streak days count
        }
      }

      res.json({
        totalSolved: solvedRow?.total_solved || 0,
        totalProblems,
        currentStreak,
        difficulty: {
          Easy: { solved: diffStats.Easy, total: diffTotals.Easy },
          Medium: { solved: diffStats.Medium, total: diffTotals.Medium },
          Hard: { solved: diffStats.Hard, total: diffTotals.Hard }
        },
        topicProgress: topicChart
      });
    } catch (err) {
      console.error('Get practice stats error:', err);
      res.status(500).json({ error: 'Failed to retrieve practice stats' });
    }
  },

  /**
   * Get problem hint
   */
  getHint: (req, res) => {
    try {
      const { id } = req.params;
      const problem = db.prepare('SELECT hints_json, title FROM problems WHERE id = ?').get(id);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      const hints = JSON.parse(problem.hints_json || '[]');
      res.json({
        hints: hints.length ? hints : ['Consider time complexity bounds and whether a hash map or two pointers can optimize lookups.']
      });
    } catch (err) {
      console.error('Get hint error:', err);
      res.status(500).json({ error: 'Failed to retrieve hints' });
    }
  },

  /**
   * Explain problem solution (only accessible after student attempts or solves)
   */
  explainSolution: (req, res) => {
    try {
      const studentId = req.user.id;
      const { id } = req.params;

      const attemptsCount = db.prepare(`
        SELECT COUNT(*) AS c FROM submissions WHERE problem_id = ? AND student_id = ?
      `).get(id, studentId)?.c || 0;

      if (attemptsCount === 0) {
        return res.status(403).json({
          error: 'You must attempt the problem at least once before viewing the full solution explanation.'
        });
      }

      const problem = db.prepare('SELECT title, solution_explanation, difficulty, topic FROM problems WHERE id = ?').get(id);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      res.json({
        title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.topic,
        explanation: problem.solution_explanation || 'Utilize optimal data structures to reduce time complexity.'
      });
    } catch (err) {
      console.error('Explain solution error:', err);
      res.status(500).json({ error: 'Failed to retrieve solution explanation' });
    }
  }
};

module.exports = practiceController;
