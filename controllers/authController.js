const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const coinService = require('../services/coinService');

const JWT_SECRET = process.env.JWT_SECRET || 'edupulse_jwt_secret_production_ready_key_hackathon_2026';

const authController = {
  login: (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Record in login_logs
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const logInfo = db.prepare(`
        INSERT INTO login_logs (user_id, login_time, ip)
        VALUES (?, CURRENT_TIMESTAMP, ?)
      `).run(user.id, String(ip));

      const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        loginLogId: logInfo.lastInsertRowid
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      const mustChange = user.must_change_password === 1;
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        skills: user.skills,
        interests: user.interests,
        must_change_password: user.must_change_password || 0,
        coinBalance: user.role === 'student' ? coinService.getBalance(user.id) : 0
      };

      res.json({
        token,
        user: sanitizedUser,
        mustChangePassword: mustChange,
        redirectUrl: mustChange ? '/change-password' : `/${user.role}/dashboard`
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  },

  register: (req, res) => {
    try {
      const { name, email, password, role, department } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const validRoles = ['student', 'teacher', 'admin'];
      const userRole = validRoles.includes(role?.toLowerCase()) ? role.toLowerCase() : 'student';

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      }

      const hash = bcrypt.hashSync(password, 10);
      const insertUser = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, department, must_change_password)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(
        name.trim(),
        email.trim().toLowerCase(),
        hash,
        userRole,
        department?.trim() || (userRole === 'admin' ? 'Administration' : 'Computer Science')
      );

      const userId = insertUser.lastInsertRowid;

      // Welcome bonus coins if student
      if (userRole === 'student') {
        try {
          coinService.awardCoins(userId, 100, 'Welcome bonus for joining EduPulse AI');
        } catch (coinErr) {
          console.warn('Could not award welcome coins:', coinErr.message);
        }
      }

      // Record in login_logs
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const logInfo = db.prepare(`
        INSERT INTO login_logs (user_id, login_time, ip)
        VALUES (?, CURRENT_TIMESTAMP, ?)
      `).run(userId, String(ip));

      const tokenPayload = {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: userRole,
        department: department?.trim() || (userRole === 'admin' ? 'Administration' : 'Computer Science'),
        loginLogId: logInfo.lastInsertRowid
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      const sanitizedUser = {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: userRole,
        department: department?.trim() || (userRole === 'admin' ? 'Administration' : 'Computer Science'),
        skills: '',
        interests: '',
        must_change_password: 0,
        coinBalance: userRole === 'student' ? 100 : 0
      };

      res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        user: sanitizedUser,
        redirectUrl: `/${userRole}/dashboard`
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Internal server error during registration' });
    }
  },

  logout: (req, res) => {
    try {
      const userId = req.user.id;
      const loginLogId = req.user.loginLogId;

      if (loginLogId) {
        db.prepare(`
          UPDATE login_logs
          SET logout_time = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).run(loginLogId, userId);
      } else {
        // Fallback: update latest open login for this user
        db.prepare(`
          UPDATE login_logs
          SET logout_time = CURRENT_TIMESTAMP
          WHERE id = (
            SELECT id FROM login_logs
            WHERE user_id = ? AND logout_time IS NULL
            ORDER BY id DESC LIMIT 1
          )
        `).run(userId);
      }

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Failed to record logout' });
    }
  },

  getMe: (req, res) => {
    try {
      const user = db.prepare(`
        SELECT id, name, email, role, department, skills, interests, must_change_password, created_at
        FROM users WHERE id = ?
      `).get(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const coinBalance = user.role === 'student' ? coinService.getBalance(user.id) : 0;
      res.json({
        user: {
          ...user,
          must_change_password: user.must_change_password || 0,
          coinBalance
        }
      });
    } catch (err) {
      console.error('getMe error:', err);
      res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
  },

  changePassword: (req, res) => {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Both old password and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
      }

      const hasNumber = /\d/.test(newPassword);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(newPassword);
      if (!hasNumber || !hasSymbol) {
        return res.status(400).json({ error: 'New password must contain at least one number and one symbol' });
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isMatch = bcrypt.compareSync(oldPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }

      const newHash = bcrypt.hashSync(newPassword, 10);
      db.prepare(`
        UPDATE users
        SET password_hash = ?, must_change_password = 0
        WHERE id = ?
      `).run(newHash, userId);

      res.json({
        success: true,
        message: 'Password changed successfully! You may now proceed to your dashboard.'
      });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
};

module.exports = authController;
