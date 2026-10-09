const db = require('./database');

function runMigrations() {
  console.log('🔄 Running database migrations for EduPulse AI upgrades...');

  // 1. users table: must_change_password
  const userColumns = db.pragma('table_info(users)').map(c => c.name);
  if (!userColumns.includes('must_change_password')) {
    db.prepare('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0').run();
  }

  // 2. coins table: reference_key
  const coinsColumns = db.pragma('table_info(coins)').map(c => c.name);
  if (!coinsColumns.includes('reference_key')) {
    db.prepare('ALTER TABLE coins ADD COLUMN reference_key TEXT').run();
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_coins_student_ref 
    ON coins(student_id, reference_key) 
    WHERE reference_key IS NOT NULL;
  `);

  // 3. chat_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. chat_history table: session_id
  const chatColumns = db.pragma('table_info(chat_history)').map(c => c.name);
  if (!chatColumns.includes('session_id')) {
    db.prepare('ALTER TABLE chat_history ADD COLUMN session_id INTEGER').run();
  }

  // 5. resumes table: target_role, template, version, breakdown, tips
  const resumeColumns = db.pragma('table_info(resumes)').map(c => c.name);
  if (!resumeColumns.includes('target_role')) {
    db.prepare("ALTER TABLE resumes ADD COLUMN target_role TEXT DEFAULT 'Full-Stack Developer'").run();
  }
  if (!resumeColumns.includes('template')) {
    db.prepare("ALTER TABLE resumes ADD COLUMN template TEXT DEFAULT 'modern'").run();
  }
  if (!resumeColumns.includes('version')) {
    db.prepare('ALTER TABLE resumes ADD COLUMN version INTEGER DEFAULT 1').run();
  }
  if (!resumeColumns.includes('breakdown_json')) {
    db.prepare('ALTER TABLE resumes ADD COLUMN breakdown_json TEXT').run();
  }
  if (!resumeColumns.includes('missing_keywords_json')) {
    db.prepare('ALTER TABLE resumes ADD COLUMN missing_keywords_json TEXT').run();
  }
  if (!resumeColumns.includes('improvement_tips_json')) {
    db.prepare('ALTER TABLE resumes ADD COLUMN improvement_tips_json TEXT').run();
  }

  // 6. performance_history table for trend charts
  db.exec(`
    CREATE TABLE IF NOT EXISTS performance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      score REAL NOT NULL,
      test_part REAL DEFAULT 0,
      coding_part REAL DEFAULT 0,
      course_part REAL DEFAULT 0,
      attendance_part REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 7. class_notes table: page_number, is_revised, svg_diagram
  const notesColumns = db.pragma('table_info(class_notes)').map(c => c.name);
  if (!notesColumns.includes('page_number')) {
    db.prepare('ALTER TABLE class_notes ADD COLUMN page_number INTEGER DEFAULT 1').run();
  }
  if (!notesColumns.includes('is_revised')) {
    db.prepare('ALTER TABLE class_notes ADD COLUMN is_revised INTEGER DEFAULT 0').run();
  }
  if (!notesColumns.includes('svg_diagram')) {
    db.prepare('ALTER TABLE class_notes ADD COLUMN svg_diagram TEXT').run();
  }
  if (!notesColumns.includes('created_at')) {
    db.prepare('ALTER TABLE class_notes ADD COLUMN created_at DATETIME').run();
  }

  // 8. courses table: category, instructor_name, rating, thumbnail
  const courseColumns = db.pragma('table_info(courses)').map(c => c.name);
  if (!courseColumns.includes('category')) {
    db.prepare("ALTER TABLE courses ADD COLUMN category TEXT DEFAULT 'Web Development'").run();
  }
  if (!courseColumns.includes('instructor_name')) {
    db.prepare("ALTER TABLE courses ADD COLUMN instructor_name TEXT DEFAULT 'Faculty Expert'").run();
  }
  if (!courseColumns.includes('rating')) {
    db.prepare('ALTER TABLE courses ADD COLUMN rating REAL DEFAULT 4.8').run();
  }

  // 9. lessons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      lesson_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 15,
      quiz_question TEXT,
      quiz_option_a TEXT,
      quiz_option_b TEXT,
      quiz_option_c TEXT,
      quiz_option_d TEXT,
      correct_option TEXT,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);

  // 10. lesson_completions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, lesson_id),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );
  `);

  // 11. problems table (Coding Practice Arena)
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
      topic TEXT NOT NULL,
      description TEXT NOT NULL,
      examples_json TEXT NOT NULL,
      constraints_json TEXT NOT NULL,
      starter_code_json TEXT NOT NULL,
      solution_explanation TEXT,
      hints_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. test_cases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id INTEGER NOT NULL,
      input TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      is_hidden INTEGER DEFAULT 0,
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
    );
  `);

  // 13. submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      problem_id INTEGER NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      status TEXT NOT NULL,
      passed INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      runtime_ms INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ All migrations applied successfully!');
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations();
}
