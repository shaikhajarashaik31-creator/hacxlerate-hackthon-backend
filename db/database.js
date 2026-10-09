const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'edupulse.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema if not present
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

// Migrations for schema additions
try {
  const userColumns = db.pragma('table_info(users)').map(c => c.name);
  if (!userColumns.includes('must_change_password')) {
    db.prepare('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0').run();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const chatColumns = db.pragma('table_info(chat_history)').map(c => c.name);
  if (!chatColumns.includes('session_id')) {
    db.prepare('ALTER TABLE chat_history ADD COLUMN session_id INTEGER').run();
  }
} catch (migErr) {
  console.warn('Database migration warning:', migErr.message);
}

module.exports = db;
