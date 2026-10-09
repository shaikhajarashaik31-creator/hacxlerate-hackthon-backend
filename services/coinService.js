const db = require('../db/database');

const coinService = {
  /**
   * Get current net balance for student
   */
  getBalance: (studentId) => {
    const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS balance
      FROM coins
      WHERE student_id = ?
    `).get(studentId);
    return row ? row.balance : 0;
  },

  /**
   * Get transaction history with running balance for student
   */
  getHistory: (studentId) => {
    const records = db.prepare(`
      SELECT id, amount, reason, reference_key, created_at
      FROM coins
      WHERE student_id = ?
      ORDER BY id ASC
    `).all(studentId);

    let running = 0;
    const historyWithBalance = records.map(r => {
      running += r.amount;
      return {
        ...r,
        running_balance: running
      };
    });

    // Return in reverse chronological order for display
    return historyWithBalance.reverse();
  },

  /**
   * Atomically award coins with referenceKey idempotency
   */
  awardCoins: (studentId, amount, reason, referenceKey = null) => {
    if (amount <= 0) return { awarded: false, reason: 'Invalid amount', newBalance: coinService.getBalance(studentId) };

    try {
      if (referenceKey) {
        const existing = db.prepare(`
          SELECT id FROM coins WHERE student_id = ? AND reference_key = ?
        `).get(studentId, referenceKey);

        if (existing) {
          return {
            awarded: false,
            alreadyAwarded: true,
            amount: 0,
            message: 'Reward already claimed for this activity',
            newBalance: coinService.getBalance(studentId)
          };
        }
      }

      const info = db.prepare(`
        INSERT INTO coins (student_id, amount, reason, reference_key, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(studentId, amount, reason, referenceKey);

      const newBalance = coinService.getBalance(studentId);
      return {
        awarded: true,
        id: info.lastInsertRowid,
        amount,
        reason,
        referenceKey,
        newBalance
      };
    } catch (err) {
      console.warn('awardCoins conflict or error:', err.message);
      return {
        awarded: false,
        alreadyAwarded: true,
        amount: 0,
        newBalance: coinService.getBalance(studentId)
      };
    }
  },

  /**
   * Spend coins for course enrollment or premium services
   */
  spendCoins: (studentId, amount, reason, referenceKey = null) => {
    const currentBalance = coinService.getBalance(studentId);
    if (currentBalance < amount) {
      return {
        success: false,
        message: `Insufficient coins balance. Required: ${amount}, Available: ${currentBalance}`
      };
    }

    const info = db.prepare(`
      INSERT INTO coins (student_id, amount, reason, reference_key, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(studentId, -Math.abs(amount), reason, referenceKey);

    return {
      success: true,
      id: info.lastInsertRowid,
      deducted: amount,
      newBalance: currentBalance - amount
    };
  },

  /**
   * Platform-wide economy statistics for administration
   */
  getPlatformEconomyStats: () => {
    const issuedRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total_issued
      FROM coins WHERE amount > 0
    `).get();

    const spentRow = db.prepare(`
      SELECT COALESCE(ABS(SUM(amount)), 0) AS total_spent
      FROM coins WHERE amount < 0
    `).get();

    const activeHoldersRow = db.prepare(`
      SELECT COUNT(DISTINCT student_id) AS total_holders
      FROM coins
    `).get();

    const recentTransactions = db.prepare(`
      SELECT c.id, c.amount, c.reason, c.created_at, u.name AS student_name, u.email AS student_email
      FROM coins c
      JOIN users u ON c.student_id = u.id
      ORDER BY c.id DESC
      LIMIT 15
    `).all();

    return {
      totalIssued: issuedRow?.total_issued || 0,
      totalSpent: spentRow?.total_spent || 0,
      netCirculation: (issuedRow?.total_issued || 0) - (spentRow?.total_spent || 0),
      activeHolders: activeHoldersRow?.total_holders || 0,
      recentTransactions
    };
  }
};

module.exports = coinService;
