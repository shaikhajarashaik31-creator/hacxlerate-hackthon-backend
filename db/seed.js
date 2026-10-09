const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('./database');

console.log('🌱 Starting database seeding for EduPulse AI...');

// Clear existing tables
const tables = [
  'chat_history',
  'chat_sessions',
  'resumes',
  'projects',
  'test_attempts',
  'questions',
  'tests',
  'activity_logs',
  'class_notes',
  'feedback',
  'certificates',
  'coins',
  'enrollments',
  'performance',
  'attendance',
  'courses',
  'login_logs',
  'users'
];

db.pragma('foreign_keys = OFF');
for (const table of tables) {
  try {
    db.prepare(`DELETE FROM ${table}`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
  } catch (e) {
    // Table may not have sqlite_sequence entry
  }
}
db.pragma('foreign_keys = ON');

// 1. Insert Users: 1 Admin, 2 Teachers, 12 Students with INDIVIDUAL UNIQUE PASSWORDS
const users = [
  {
    name: 'Dr. Arthur Pendelton',
    email: 'admin@admin.edu',
    password: 'Admin@2026#Edu',
    role: 'admin',
    department: 'Administration & Academic Affairs',
    skills: 'Leadership, Education Policy, Analytics',
    interests: 'Higher Ed Innovation, Student Retention'
  },
  {
    name: 'Prof. Sarah Jenkins',
    email: 'sarah.jenkins@teacher.edu',
    password: 'Sarah@2026#Prof',
    role: 'teacher',
    department: 'Computer Science',
    skills: 'Algorithms, Full-Stack, System Architecture',
    interests: 'Distributed Systems, Web Tech, Mentorship'
  },
  {
    name: 'Dr. David Kumar',
    email: 'david.kumar@teacher.edu',
    password: 'David@2026#Prof',
    role: 'teacher',
    department: 'Data Science & AI',
    skills: 'Machine Learning, Deep Learning, Cloud Systems',
    interests: 'Generative AI, Ethics in AI, Data Engineering'
  },
  // 12 Students with individual passwords
  {
    name: 'Alex Chen',
    email: 'alex.chen@student.edu',
    password: 'Alex@2026#CS01',
    role: 'student',
    department: 'Computer Science',
    skills: 'React, Node.js, TypeScript, Python, Git',
    interests: 'Full Stack Development, Open Source, System Design'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@student.edu',
    password: 'Priya@2026#AI02',
    role: 'student',
    department: 'Data Science & AI',
    skills: 'Python, PyTorch, Pandas, Scikit-learn, SQL',
    interests: 'Machine Learning, NLP, Computer Vision'
  },
  {
    name: 'Marcus Johnson',
    email: 'marcus.johnson@student.edu',
    password: 'Marcus@2026#CS03',
    role: 'student',
    department: 'Computer Science',
    skills: 'Java, Spring Boot, MySQL, Docker, React',
    interests: 'Backend Systems, Cloud Platforms'
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@student.edu',
    password: 'Emily@2026#AI04',
    role: 'student',
    department: 'Data Science & AI',
    skills: 'Python, TensorFlow, R, Data Viz, Tableau',
    interests: 'Predictive Analytics, Healthcare AI'
  },
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.edu',
    password: 'Rahul@2026#CS05',
    role: 'student',
    department: 'Computer Science',
    skills: 'C++, Python, Competitive Programming, Linux',
    interests: 'Low-latency Systems, Embedded Dev'
  },
  {
    name: 'Sophia Martinez',
    email: 'sophia.martinez@student.edu',
    password: 'Sophia@2026#CS06',
    role: 'student',
    department: 'Computer Science',
    skills: 'HTML, CSS, JavaScript, Figma, UI/UX',
    interests: 'Frontend Engineering, Design Systems'
  },
  {
    name: 'Liam Wilson',
    email: 'liam.wilson@student.edu',
    password: 'Liam@2026#AI07',
    role: 'student',
    department: 'Data Science & AI',
    skills: 'Python, SQL, PowerBI, Statistical Analysis',
    interests: 'Business Intelligence, FinTech'
  },
  {
    name: 'Olivia Taylor',
    email: 'olivia.taylor@student.edu',
    password: 'Olivia@2026#AI08',
    role: 'student',
    department: 'Data Science & AI',
    skills: 'Python, NLP, Hugging Face, Flask',
    interests: 'Large Language Models, Conversational AI'
  },
  {
    name: 'Noah Anderson',
    email: 'noah.anderson@student.edu',
    password: 'Noah@2026#CS09',
    role: 'student',
    department: 'Computer Science',
    skills: 'Go, Rust, Docker, Kubernetes, Linux',
    interests: 'DevOps, Site Reliability, Cloud Native'
  },
  {
    name: 'Ava Thomas',
    email: 'ava.thomas@student.edu',
    password: 'Ava@2026#CS10',
    role: 'student',
    department: 'Computer Science',
    skills: 'React, Next.js, Node.js, GraphQL, AWS',
    interests: 'Cloud Architectures, Serverless'
  },
  {
    name: 'Ethan Jackson',
    email: 'ethan.jackson@student.edu',
    password: 'Ethan@2026#AI11',
    role: 'student',
    department: 'Data Science & AI',
    skills: 'Python, Basic Machine Learning, SQL',
    interests: 'Data Analytics, Cyber Threat Intel'
  },
  {
    name: 'Mia White',
    email: 'mia.white@student.edu',
    password: 'Mia@2026#CS12',
    role: 'student',
    department: 'Computer Science',
    skills: 'JavaScript, React, TailwindCSS, Express',
    interests: 'Interactive Web Apps, Mobile Development'
  }
];

const insertUserStmt = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, department, skills, interests, must_change_password)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1)
`);

let credsFileText = `================================================================================
EDUPULSE AI — DEMO CREDENTIALS DIRECTORY
================================================================================
Notice: Every user has a unique password. Upon first sign-in, users are flagged
with must_change_password=1 and will be redirected to /change-password.
================================================================================

[ADMINISTRATION]
Name:     Dr. Arthur Pendelton
Email:    admin@admin.edu
Password: Admin@2026#Edu
Role:     admin (Platform Governance)

[FACULTY / TEACHERS]
Name:     Prof. Sarah Jenkins
Email:    sarah.jenkins@teacher.edu
Password: Sarah@2026#Prof
Role:     teacher (Computer Science — Qualifying feedback cohort: 4 students >= 80%)

Name:     Dr. David Kumar
Email:    david.kumar@teacher.edu
Password: David@2026#Prof
Role:     teacher (Data Science & AI — Qualifying feedback cohort: 2 students < 80%)

[STUDENTS]
`;

for (const u of users) {
  const passwordHash = bcrypt.hashSync(u.password, 10);
  insertUserStmt.run(u.name, u.email, passwordHash, u.role, u.department, u.skills, u.interests);
  if (u.role === 'student') {
    credsFileText += `Name:     ${u.name}\nEmail:    ${u.email}\nPassword: ${u.password}\nRole:     student\n\n`;
  }
}

credsFileText += `================================================================================\nGenerated automatically during database seed.\n`;
fs.writeFileSync(path.join(__dirname, 'demo_credentials.txt'), credsFileText, 'utf8');

console.log('✅ Users inserted with individual passwords and must_change_password=1');
console.log('📁 Credentials saved to backend/db/demo_credentials.txt');

// 2. Insert Courses: 4 Regular, 2 Extra Paid Courses
const courses = [
  {
    title: 'Full-Stack Web Development',
    description: 'Master modern frontend & backend development with React, Node.js, Express, and REST APIs.',
    teacher_id: 2, // Prof. Sarah Jenkins
    coin_cost: 0,
    is_extra: 0,
    total_lessons: 24
  },
  {
    title: 'Data Structures & Algorithms in Python',
    description: 'Deep dive into computational complexity, graph algorithms, dynamic programming, and interview challenges.',
    teacher_id: 2, // Prof. Sarah Jenkins
    coin_cost: 0,
    is_extra: 0,
    total_lessons: 30
  },
  {
    title: 'Machine Learning & Neural Networks',
    description: 'Supervised & unsupervised learning, gradient descent, deep neural networks, and computer vision.',
    teacher_id: 3, // Dr. David Kumar
    coin_cost: 0,
    is_extra: 0,
    total_lessons: 28
  },
  {
    title: 'Cloud Computing & DevOps Essentials',
    description: 'Infrastructure as Code, Docker containerization, CI/CD pipelines, and AWS/GCP deployments.',
    teacher_id: 3, // Dr. David Kumar
    coin_cost: 0,
    is_extra: 0,
    total_lessons: 20
  },
  {
    title: 'Advanced Generative AI & Prompt Engineering',
    description: 'LLM fine-tuning, RAG architectures, vector embeddings, and autonomous agent systems.',
    teacher_id: 3, // Dr. David Kumar
    coin_cost: 120,
    is_extra: 1,
    total_lessons: 16
  },
  {
    title: 'System Design & Distributed Architectures',
    description: 'High-availability microservices, distributed caches, sharding, message queues, and fault tolerance.',
    teacher_id: 2, // Prof. Sarah Jenkins
    coin_cost: 150,
    is_extra: 1,
    total_lessons: 18
  }
];

const insertCourseStmt = db.prepare(`
  INSERT INTO courses (title, description, teacher_id, coin_cost, is_extra, total_lessons)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const c of courses) {
  insertCourseStmt.run(c.title, c.description, c.teacher_id, c.coin_cost, c.is_extra, c.total_lessons);
}
console.log('✅ 6 Courses inserted (4 standard, 2 extra paid)');

// 3. Class Notes for courses across past dates
const classNotes = [
  {
    course_id: 1,
    class_date: '2026-09-12',
    title: 'Component Lifecycle and Custom Hooks in React',
    content: `## Key Concepts Covered
1. **useEffect Dependencies**: Proper memoization using \`useCallback\` and \`useMemo\` to prevent infinite render loops.
2. **Custom Hook Architecture**: Encapsulating reusable state logic (e.g., \`useFetch\`, \`useLocalStorage\`).
3. **Clean-up Functions**: Aborting active \`AbortController\` signals and clearing timer subscriptions.

### Important Formulas & Snippets:
\`\`\`js
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal });
  return () => controller.abort();
}, [fetchData]);
\`\`\`
*Takeaway*: Always define cleanup functions for async tasks and listeners.`
  },
  {
    course_id: 1,
    class_date: '2026-09-18',
    title: 'State Management with React Context & Reducers',
    content: `## Key Concepts Covered
1. **useReducer Pattern**: Action-driven state transitions matching Redux architectural patterns.
2. **Context Splitting**: Separating State Context from Dispatch Context to optimize re-renders.
3. **Prop Drilling Elimination**: Deep hierarchy access without cumbersome prop passing.

*Teacher Note*: Quiz next week on Context re-render performance bottlenecks.`
  },
  {
    course_id: 1,
    class_date: '2026-09-25',
    title: 'RESTful API Architecture & Express Middleware',
    content: `## Key Concepts Covered
1. **Middleware Pipeline**: Execution order of \`app.use()\`, handling \`next()\`, and error-first signatures.
2. **JWT Authentication**: Bearer tokens, HMAC-SHA256 signature verification, and HTTP-only cookie considerations.
3. **CORS & Rate Limiting**: Securing API endpoints against cross-origin scripting and brute-force attacks.`
  },
  {
    course_id: 2,
    class_date: '2026-09-15',
    title: 'Dynamic Programming: Memoization vs Tabulation',
    content: `## Key Concepts Covered
1. **Optimal Substructure & Overlapping Subproblems**: Recognizing DP problem invariants.
2. **Top-Down (Memoization)**: Recursive call tree with hash map caching: Time $O(N)$, Space $O(N)$ stack.
3. **Bottom-Up (Tabulation)**: Iterative array population eliminating call stack overhead.
4. **0/1 Knapsack Problem**: Transition formula $dp[i][w] = \max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])$.`
  },
  {
    course_id: 2,
    class_date: '2026-09-22',
    title: 'Graph Traversals: Dijkstra & A* Shortest Path',
    content: `## Key Concepts Covered
1. **Priority Queue Implementations**: Min-heap operations with $O((V+E) \log V)$ asymptotic bounds.
2. **Negative Edge Detection**: Why Dijkstra fails with negative weights and when to use Bellman-Ford.
3. **Heuristic Admissibility**: In A* search, $h(n)$ must never overestimate the true cost to target.`
  },
  {
    course_id: 3,
    class_date: '2026-09-14',
    title: 'Backpropagation & Gradient Descent Optimizers',
    content: `## Key Concepts Covered
1. **Chain Rule in Computational Graphs**: Calculating partial derivatives $\\frac{\\partial L}{\\partial W^{[l]}}$.
2. **Vanishing / Exploding Gradients**: Mitigating using He/Xavier weight initialization and LayerNorm.
3. **Adam Optimizer**: Combining momentum (1st moment) with RMSprop (2nd uncentered moment).`
  },
  {
    course_id: 3,
    class_date: '2026-09-24',
    title: 'Transformer Architecture: Self-Attention Mechanisms',
    content: `## Key Concepts Covered
1. **Scaled Dot-Product Attention**:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$
2. **Multi-Head Attention**: Linear projections allowing representations at multiple coordinate subspaces.
3. **Positional Encodings**: Sinusoidal functions injecting spatial token ordering.`
  },
  {
    course_id: 4,
    class_date: '2026-09-20',
    title: 'Docker Internals: Namespaces, Cgroups & Layer Caching',
    content: `## Key Concepts Covered
1. **Linux Namespaces**: PID, NET, MNT isolation providing virtualized environment boundaries.
2. **Control Groups (cgroups)**: Hardware quota allocation for CPU shares and memory limits.
3. **Multi-Stage Builds**: Drastically reducing final container image footprints for production.`
  }
];

const insertNotesStmt = db.prepare(`
  INSERT INTO class_notes (course_id, class_date, title, content)
  VALUES (?, ?, ?, ?)
`);

for (const n of classNotes) {
  insertNotesStmt.run(n.course_id, n.class_date, n.title, n.content);
}
console.log('✅ Class notes inserted');

// 4. Enrollments & Performance
// Student IDs: 4 to 15 (12 students)
const studentProfiles = [
  { id: 4, name: 'Alex Chen', targetAtt: 0.94, score: 92, coins: 250, extraDone: true },
  { id: 5, name: 'Priya Patel', targetAtt: 0.92, score: 88, coins: 200, extraDone: false },
  { id: 6, name: 'Marcus Johnson', targetAtt: 0.85, score: 84, coins: 180, extraDone: false },
  { id: 7, name: 'Emily Watson', targetAtt: 0.81, score: 82, coins: 150, extraDone: false },
  { id: 8, name: 'Rahul Sharma', targetAtt: 0.65, score: 86, coins: 110, extraDone: false },
  { id: 9, name: 'Sophia Martinez', targetAtt: 0.68, score: 58, coins: 60, extraDone: false },
  { id: 10, name: 'Liam Wilson', targetAtt: 0.74, score: 72, coins: 80, extraDone: false },
  { id: 11, name: 'Olivia Taylor', targetAtt: 0.88, score: 74, coins: 90, extraDone: false },
  { id: 12, name: 'Noah Anderson', targetAtt: 0.78, score: 89, coins: 120, extraDone: false },
  { id: 13, name: 'Ava Thomas', targetAtt: 0.90, score: 91, coins: 310, extraDone: true },
  { id: 14, name: 'Ethan Jackson', targetAtt: 0.60, score: 65, coins: 40, extraDone: false },
  { id: 15, name: 'Mia White', targetAtt: 0.84, score: 85, coins: 160, extraDone: false }
];

const insertEnrollment = db.prepare(`
  INSERT INTO enrollments (student_id, course_id, progress_percent, status, enrolled_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertPerformance = db.prepare(`
  INSERT INTO performance (student_id, course_id, score, updated_at)
  VALUES (?, ?, ?, ?)
`);

const insertAttendance = db.prepare(`
  INSERT INTO attendance (student_id, course_id, class_date, status)
  VALUES (?, ?, ?, ?)
`);

const insertCoins = db.prepare(`
  INSERT INTO coins (student_id, amount, reason, created_at)
  VALUES (?, ?, ?, ?)
`);

// 30 days dates list
const dates = [];
for (let i = 28; i >= 1; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  // Skip weekends
  if (d.getDay() !== 0 && d.getDay() !== 6) {
    dates.push(d.toISOString().slice(0, 10));
  }
}

// Enroll each student into standard courses (1, 2 for CS; 2, 3, 4 for AI)
for (const sp of studentProfiles) {
  const studentCourses = [1, 2, 3]; // standard courses
  if (sp.id % 2 === 0) studentCourses.push(4);

  // Extra course enrollment
  if (sp.extraDone) {
    studentCourses.push(5);
  }

  for (const cId of studentCourses) {
    const isCompleted = sp.extraDone && cId === 5;
    const progress = isCompleted ? 100 : Math.min(95, Math.floor(sp.score * 0.95) + (sp.id % 5));
    const status = isCompleted ? 'completed' : 'in_progress';
    const completedAt = isCompleted ? '2026-10-02 14:00:00' : null;

    insertEnrollment.run(sp.id, cId, progress, status, '2026-09-01 09:00:00', completedAt);

    // Variation in score per course
    const courseScore = Math.max(45, Math.min(99, sp.score + ((cId * 3) % 9) - 4));
    insertPerformance.run(sp.id, cId, courseScore, '2026-10-01 12:00:00');

    // Generate attendance records for regular courses
    if (cId <= 4) {
      dates.forEach((dateStr, idx) => {
        // Deterministic pseudo-random attendance based on targetAtt
        const seedVal = ((sp.id * 17) + (cId * 7) + (idx * 13)) % 100;
        const status = (seedVal / 100 < sp.targetAtt) ? 'present' : 'absent';
        insertAttendance.run(sp.id, cId, dateStr, status);
      });
    }
  }

  // Coins history
  insertCoins.run(sp.id, 100, 'Welcome bonus on onboarding', '2026-09-01 09:00:00');
  if (sp.score >= 80) {
    insertCoins.run(sp.id, 50, 'Academic Excellence: High course score >= 80', '2026-09-20 16:00:00');
  }
  if (sp.targetAtt >= 0.85) {
    insertCoins.run(sp.id, 30, 'Attendance Streak: Consistent class attendance', '2026-09-28 17:00:00');
  }
  insertCoins.run(sp.id, 10, 'Completed Mock Test Challenge', '2026-10-02 11:00:00');
  if (sp.extraDone) {
    insertCoins.run(sp.id, -120, 'Enrolled in Advanced Generative AI & Prompt Engineering', '2026-09-15 10:00:00');
    insertCoins.run(sp.id, 100, 'Course Completion Bonus: Advanced Generative AI', '2026-10-02 14:00:00');
  }
}

console.log('✅ Enrollments, Performance, Attendance, and Coins inserted');

// 5. Certificates for students who finished extra courses
const certificates = [
  {
    student_id: 13, // Ava Thomas
    course_id: 5,
    certificate_code: 'EDU-2026-GENAI-8831',
    issued_at: '2026-10-02 14:30:00'
  },
  {
    student_id: 4, // Alex Chen
    course_id: 5,
    certificate_code: 'EDU-2026-GENAI-9942',
    issued_at: '2026-10-03 16:00:00'
  }
];

const insertCert = db.prepare(`
  INSERT INTO certificates (student_id, course_id, certificate_code, issued_at)
  VALUES (?, ?, ?, ?)
`);

for (const cert of certificates) {
  insertCert.run(cert.student_id, cert.course_id, cert.certificate_code, cert.issued_at);
}
console.log('✅ Certificates inserted');

// 6. Feedback: Some from top students (att>=80% & score>=80%), some from others
const feedbacks = [
  // Top students (Attendance >= 80% AND Score >= 80%):
  {
    student_id: 4, // Alex (att 94%, score 92%)
    teacher_id: 2,
    course_id: 1,
    rating: 5,
    comment: 'Prof. Sarah explains state management with incredible clarity. The live coding sessions on custom hooks gave me confidence to build full-scale apps.',
    created_at: '2026-09-29 14:00:00'
  },
  {
    student_id: 5, // Priya (att 92%, score 88%)
    teacher_id: 3,
    course_id: 3,
    rating: 5,
    comment: 'Dr. Kumar breaks down mathematical equations into intuitive visualizations. The deep dive into backpropagation was the best lecture of the semester.',
    created_at: '2026-09-28 11:30:00'
  },
  {
    student_id: 6, // Marcus (att 85%, score 84%)
    teacher_id: 2,
    course_id: 2,
    rating: 4,
    comment: 'Great algorithmic drills. Would love even more practice problems on dynamic programming and graph theory before the final assessments.',
    created_at: '2026-09-27 15:45:00'
  },
  {
    student_id: 7, // Emily (att 81%, score 82%)
    teacher_id: 3,
    course_id: 3,
    rating: 4,
    comment: 'Assignments are hands-on and practical. It would be helpful to have extra office hours specifically for debugging PyTorch tensor shapes.',
    created_at: '2026-09-30 10:15:00'
  },
  {
    student_id: 13, // Ava (att 90%, score 91%)
    teacher_id: 2,
    course_id: 1,
    rating: 5,
    comment: 'The project-based evaluation criteria push us to adhere to industry best practices like testing, linting, and modular microservices.',
    created_at: '2026-10-01 16:20:00'
  },
  {
    student_id: 15, // Mia (att 84%, score 85%)
    teacher_id: 2,
    course_id: 1,
    rating: 5,
    comment: 'Fast response to code reviews and constructive feedback. The course pace is perfect for modern web engineering.',
    created_at: '2026-10-02 09:30:00'
  },
  // Non-eligible students (ignored by FeedbackSummary filter):
  {
    student_id: 8, // Rahul: Score 86% but attendance 65% (<80%)
    teacher_id: 2,
    course_id: 1,
    rating: 3,
    comment: 'Lectures are good but missed sessions made it hard to keep track of assignments.',
    created_at: '2026-09-25 12:00:00'
  },
  {
    student_id: 9, // Sophia: Score 58% (<80%) and attendance 68% (<80%)
    teacher_id: 2,
    course_id: 1,
    rating: 2,
    comment: 'Pace is too fast and concepts are overwhelming without more introductory basics.',
    created_at: '2026-09-24 16:00:00'
  },
  {
    student_id: 11, // Olivia: Attendance 88% but score 74% (<80%)
    teacher_id: 3,
    course_id: 3,
    rating: 3,
    comment: 'Hard tests, need more formula cheat sheets before mock exams.',
    created_at: '2026-09-22 17:00:00'
  }
];

const insertFeedback = db.prepare(`
  INSERT INTO feedback (student_id, teacher_id, course_id, rating, comment, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const fb of feedbacks) {
  insertFeedback.run(fb.student_id, fb.teacher_id, fb.course_id, fb.rating, fb.comment, fb.created_at);
}
console.log('✅ Feedback inserted (both high achievers and filtered students)');

// 7. Login Logs
const loginLogs = [
  // Admin
  { user_id: 1, login_time: '2026-10-08 08:30:00', logout_time: '2026-10-08 12:15:00', ip: '192.168.1.10' },
  { user_id: 1, login_time: '2026-10-07 09:00:00', logout_time: '2026-10-07 17:00:00', ip: '192.168.1.10' },
  // Teachers
  { user_id: 2, login_time: '2026-10-08 08:45:00', logout_time: null, ip: '192.168.1.25' },
  { user_id: 2, login_time: '2026-10-07 08:15:00', logout_time: '2026-10-07 16:30:00', ip: '192.168.1.25' },
  { user_id: 3, login_time: '2026-10-08 09:10:00', logout_time: null, ip: '192.168.1.28' },
  { user_id: 3, login_time: '2026-10-06 10:00:00', logout_time: '2026-10-06 15:45:00', ip: '192.168.1.28' },
  // Students
  { user_id: 4, login_time: '2026-10-08 09:30:00', logout_time: null, ip: '10.0.4.12' },
  { user_id: 4, login_time: '2026-10-07 10:15:00', logout_time: '2026-10-07 12:45:00', ip: '10.0.4.12' },
  { user_id: 5, login_time: '2026-10-08 10:05:00', logout_time: null, ip: '10.0.4.15' },
  { user_id: 6, login_time: '2026-10-08 11:20:00', logout_time: null, ip: '10.0.4.22' },
  { user_id: 7, login_time: '2026-10-08 08:50:00', logout_time: '2026-10-08 11:30:00', ip: '10.0.4.19' },
  { user_id: 8, login_time: '2026-10-07 14:10:00', logout_time: '2026-10-07 15:00:00', ip: '10.0.4.31' },
  { user_id: 9, login_time: '2026-10-06 09:15:00', logout_time: '2026-10-06 10:45:00', ip: '10.0.4.45' },
  { user_id: 10, login_time: '2026-10-08 09:40:00', logout_time: null, ip: '10.0.4.52' },
  { user_id: 11, login_time: '2026-10-07 11:00:00', logout_time: '2026-10-07 13:20:00', ip: '10.0.4.60' },
  { user_id: 12, login_time: '2026-10-08 10:40:00', logout_time: null, ip: '10.0.4.71' },
  { user_id: 13, login_time: '2026-10-08 09:00:00', logout_time: null, ip: '10.0.4.88' },
  { user_id: 14, login_time: '2026-10-05 13:10:00', logout_time: '2026-10-05 14:00:00', ip: '10.0.4.92' },
  { user_id: 15, login_time: '2026-10-08 10:15:00', logout_time: null, ip: '10.0.4.95' }
];

const insertLogin = db.prepare(`
  INSERT INTO login_logs (user_id, login_time, logout_time, ip)
  VALUES (?, ?, ?, ?)
`);

for (const log of loginLogs) {
  insertLogin.run(log.user_id, log.login_time, log.logout_time, log.ip);
}
console.log('✅ Login logs inserted');

// 8. Activity Logs
const activityLogs = [
  { user_id: 4, page: '/student/dashboard', course_id: null, test_id: null, event_type: 'page_view', duration_seconds: 420 },
  { user_id: 4, page: '/student/courses/1', course_id: 1, test_id: null, event_type: 'course_time', duration_seconds: 3600 },
  { user_id: 4, page: '/student/tests/1', course_id: 2, test_id: 1, event_type: 'test_time', duration_seconds: 840 },
  { user_id: 5, page: '/student/courses/3', course_id: 3, test_id: null, event_type: 'course_time', duration_seconds: 4200 },
  { user_id: 5, page: '/student/tests/2', course_id: 1, test_id: 2, event_type: 'test_time', duration_seconds: 780 },
  { user_id: 6, page: '/student/code-editor', course_id: null, test_id: null, event_type: 'page_view', duration_seconds: 2400 },
  { user_id: 7, page: '/student/resume', course_id: null, test_id: null, event_type: 'page_view', duration_seconds: 1500 },
  { user_id: 8, page: '/student/notes', course_id: 1, test_id: null, event_type: 'course_time', duration_seconds: 1200 },
  { user_id: 13, page: '/student/courses/5', course_id: 5, test_id: null, event_type: 'course_time', duration_seconds: 5400 },
  { user_id: 2, page: '/teacher/dashboard', course_id: null, test_id: null, event_type: 'page_view', duration_seconds: 3600 },
  { user_id: 3, page: '/teacher/analytics', course_id: null, test_id: null, event_type: 'page_view', duration_seconds: 2800 },
  { user_id: 1, page: '/admin/dashboard', course_id: null, test_id: null, event_type: 'page_view', duration_seconds: 4800 }
];

const insertActivity = db.prepare(`
  INSERT INTO activity_logs (user_id, page, course_id, test_id, event_type, duration_seconds)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const a of activityLogs) {
  insertActivity.run(a.user_id, a.page, a.course_id, a.test_id, a.event_type, a.duration_seconds);
}
console.log('✅ Activity logs inserted');

// 9. Tests and 10 Questions each
const tests = [
  {
    title: 'Data Structures & Algorithms Sprint',
    course_id: 2,
    duration_minutes: 15,
    type: 'mock_test',
    questions: [
      {
        question: 'What is the worst-case time complexity of lookup in a balanced Binary Search Tree (AVL / Red-Black)?',
        option_a: 'O(1)',
        option_b: 'O(log N)',
        option_c: 'O(N)',
        option_d: 'O(N log N)',
        correct_option: 'B'
      },
      {
        question: 'Which sorting algorithm is guaranteed to be stable and possesses an O(N log N) worst-case time complexity?',
        option_a: 'Quicksort',
        option_b: 'Heapsort',
        option_c: 'Merge Sort',
        option_d: 'Selection Sort',
        correct_option: 'C'
      },
      {
        question: 'In Python, what is the average time complexity of checking membership `x in s` if `s` is a set?',
        option_a: 'O(1)',
        option_b: 'O(log N)',
        option_c: 'O(N)',
        option_d: 'O(N^2)',
        correct_option: 'A'
      },
      {
        question: 'Which data structure is primarily used to implement Breadth-First Search (BFS) in a graph?',
        option_a: 'Stack',
        option_b: 'Priority Queue',
        option_c: 'Queue (FIFO)',
        option_d: 'Disjoint Set (Union-Find)',
        correct_option: 'C'
      },
      {
        question: 'What is the space complexity of an iterative Dijkstra algorithm with V vertices and E edges using an adjacency list and min-heap?',
        option_a: 'O(1)',
        option_b: 'O(V + E)',
        option_c: 'O(V^2)',
        option_d: 'O(E log V)',
        correct_option: 'B'
      },
      {
        question: 'What happens during a hash table collision when using Open Addressing with Linear Probing?',
        option_a: 'A new node is appended to a linked list at the bucket',
        option_b: 'The hash table expands immediately by a factor of 2',
        option_c: 'The algorithm sequentially checks subsequent index slots until an empty slot is located',
        option_d: 'An exception is thrown',
        correct_option: 'C'
      },
      {
        question: 'Which algorithm is optimal for finding the Minimum Spanning Tree (MST) in a dense graph where E ≈ V^2?',
        option_a: "Prim's algorithm with adjacency matrix O(V^2)",
        option_b: "Kruskal's algorithm O(E log E)",
        option_c: 'Floyd-Warshall algorithm',
        option_d: 'Tarjan Strongly Connected Components',
        correct_option: 'A'
      },
      {
        question: 'What is the time complexity to find the diameter of a general undirected binary tree?',
        option_a: 'O(N)',
        option_b: 'O(N^2)',
        option_c: 'O(log N)',
        option_d: 'O(2^N)',
        correct_option: 'A'
      },
      {
        question: 'In dynamic programming, which condition MUST hold true for the problem to be solvable via DP?',
        option_a: 'Greedy choice property only',
        option_b: 'Optimal substructure and overlapping subproblems',
        option_c: 'Negative cycle invariance',
        option_d: 'Monotonic strictly increasing recurrence',
        correct_option: 'B'
      },
      {
        question: 'What is the amortized time complexity of inserting an element into a dynamic array (like std::vector or Python list)?',
        option_a: 'O(N)',
        option_b: 'O(log N)',
        option_c: 'O(1)',
        option_d: 'O(N^2)',
        correct_option: 'C'
      }
    ]
  },
  {
    title: 'Full-Stack JavaScript & React Mastery',
    course_id: 1,
    duration_minutes: 15,
    type: 'mock_test',
    questions: [
      {
        question: 'In React 18, what new concurrent feature allows you to mark state updates as non-urgent transitions?',
        option_a: 'useDeferredValue and startTransition',
        option_b: 'useUrgentState',
        option_c: 'React.lazyLoadOnly',
        option_d: 'useConcurrentMemo',
        correct_option: 'A'
      },
      {
        question: 'What is the primary difference between `==` and `===` operators in JavaScript?',
        option_a: '`==` compares object references while `===` compares values',
        option_b: '`===` checks strict equality without type coercion; `==` coerces types',
        option_c: '`==` is deprecated in ECMAScript 2022',
        option_d: '`===` executes asynchronously',
        correct_option: 'B'
      },
      {
        question: 'Why must cleanup functions in `useEffect` be returned rather than called directly inside the effect body?',
        option_a: 'React calls the cleanup function before the component unmounts or before re-running the effect',
        option_b: 'To prevent garbage collection',
        option_c: 'Because Javascript promises require a return value',
        option_d: 'It triggers immediate microtask batching',
        correct_option: 'A'
      },
      {
        question: 'Which HTTP status code should a server return when JWT authentication fails due to an invalid token signature?',
        option_a: '400 Bad Request',
        option_b: '401 Unauthorized',
        option_c: '403 Forbidden',
        option_d: '404 Not Found',
        correct_option: 'B'
      },
      {
        question: 'What is the Event Loop order of execution priority in Node.js?',
        option_a: 'Macrotasks (setTimeout) -> Microtasks (Promise.then, process.nextTick)',
        option_b: 'Microtasks execute immediately after the current operation and before the next macrotask',
        option_c: 'SetImmediate always executes before process.nextTick',
        option_d: 'All callbacks run in parallel worker threads automatically',
        correct_option: 'B'
      },
      {
        question: 'In Express.js, what must you pass into `next()` to invoke the global error-handling middleware?',
        option_a: 'A boolean false: next(false)',
        option_b: 'An Error object or error parameter: next(new Error(...))',
        option_c: 'A status code number: next(500)',
        option_d: 'Nothing, just call next()',
        correct_option: 'B'
      },
      {
        question: 'What is the purpose of React `useCallback` hook?',
        option_a: 'To execute an asynchronous callback without blocking UI',
        option_b: 'To return a memoized version of the callback function that only changes if dependencies change',
        option_c: 'To register global window event listeners',
        option_d: 'To bind class component this references',
        correct_option: 'B'
      },
      {
        question: 'Which CSS positioning scheme removes an element from the normal document flow and positions it relative to its closest positioned ancestor?',
        option_a: 'position: relative',
        option_b: 'position: absolute',
        option_c: 'position: static',
        option_d: 'position: sticky',
        correct_option: 'B'
      },
      {
        question: 'What is the risk of using user input directly inside `dangerouslySetInnerHTML` in React?',
        option_a: 'Memory leaks from uncollected DOM elements',
        option_b: 'Cross-Site Scripting (XSS) vulnerability',
        option_c: 'Cross-Site Request Forgery (CSRF)',
        option_d: 'SQL Injection on client side',
        correct_option: 'B'
      },
      {
        question: 'Which SQL statement clause is used to filter records based on aggregated conditions like `COUNT(*)` or `AVG()`?',
        option_a: 'WHERE',
        option_b: 'HAVING',
        option_c: 'GROUP FILTER',
        option_d: 'ORDER BY',
        correct_option: 'B'
      }
    ]
  }
];

const insertTestStmt = db.prepare(`
  INSERT INTO tests (title, course_id, duration_minutes, type)
  VALUES (?, ?, ?, ?)
`);

const insertQuestionStmt = db.prepare(`
  INSERT INTO questions (test_id, question, option_a, option_b, option_c, option_d, correct_option)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertTestAttemptStmt = db.prepare(`
  INSERT INTO test_attempts (student_id, test_id, score, time_taken_seconds, taken_at)
  VALUES (?, ?, ?, ?, ?)
`);

tests.forEach((t) => {
  const result = insertTestStmt.run(t.title, t.course_id, t.duration_minutes, t.type);
  const testId = result.lastInsertRowid;

  for (const q of t.questions) {
    insertQuestionStmt.run(testId, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option);
  }

  // Pre-seed some test attempts for students
  insertTestAttemptStmt.run(4, testId, 90.0, 680, '2026-10-04 14:15:00');
  insertTestAttemptStmt.run(5, testId, 80.0, 750, '2026-10-05 16:30:00');
  insertTestAttemptStmt.run(13, testId, 100.0, 610, '2026-10-06 11:00:00');
});
console.log('✅ 2 Mock Tests and 20 Questions inserted with attempts');

// 10. Sample Projects for Code Editor & Projects page
const sampleProjects = [
  {
    student_id: 4, // Alex Chen
    title: 'Distributed Rate Limiter in Python',
    description: 'Sliding window rate limiter algorithm with Redis-like token bucket simulation.',
    language: 'python',
    code: `import time

class TokenBucketRateLimiter:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = capacity
        self.refill_rate = refill_rate_per_sec
        self.tokens = capacity
        self.last_refill = time.time()

    def allow_request(self, tokens_needed: int = 1) -> bool:
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

        if self.tokens >= tokens_needed:
            self.tokens -= tokens_needed
            return True
        return False

# Demonstration
limiter = TokenBucketRateLimiter(capacity=5, refill_rate_per_sec=2.0)
for i in range(8):
    allowed = limiter.allow_request(1)
    print(f"Request #{i+1}: {'ALLOWED' if allowed else 'THROTTLED (429)'}")
    time.sleep(0.2)
`
  },
  {
    student_id: 4,
    title: 'Interactive Binary Search Tree in JavaScript',
    description: 'BST class with recursive insertion, in-order traversal, and node depth calculations.',
    language: 'javascript',
    code: `class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  insert(val) {
    const newNode = new TreeNode(val);
    if (!this.root) {
      this.root = newNode;
      return;
    }
    let cur = this.root;
    while (true) {
      if (val < cur.val) {
        if (!cur.left) { cur.left = newNode; break; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = newNode; break; }
        cur = cur.right;
      }
    }
  }

  inOrder(node = this.root, res = []) {
    if (!node) return res;
    this.inOrder(node.left, res);
    res.push(node.val);
    this.inOrder(node.right, res);
    return res;
  }
}

const tree = new BST();
[45, 15, 78, 8, 23, 90, 62].forEach(n => tree.insert(n));
console.log("In-order sorted nodes:", tree.inOrder());
`
  },
  {
    student_id: 5, // Priya
    title: 'Linear Regression Gradient Descent from Scratch',
    description: 'Mathematical numpy-style implementation without heavy framework dependencies.',
    language: 'python',
    code: `def compute_cost(X, y, w, b):
    m = len(y)
    total_cost = sum(((w * X[i] + b) - y[i])**2 for i in range(m))
    return total_cost / (2 * m)

def gradient_descent(X, y, lr=0.01, epochs=1000):
    w, b = 0.0, 0.0
    m = len(y)
    for _ in range(epochs):
        dw = (1/m) * sum(((w * X[i] + b) - y[i]) * X[i] for i in range(m))
        db = (1/m) * sum(((w * X[i] + b) - y[i]) for i in range(m))
        w -= lr * dw
        b -= lr * db
    return w, b

# Sample hours studied vs exam score
X = [1, 2, 3, 4, 5, 6]
y = [52, 60, 68, 77, 85, 94]
w, b = gradient_descent(X, y)
print(f"Learned Weight: {w:.2f}, Bias: {b:.2f}")
print(f"Prediction for 7 hours: {w * 7 + b:.2f}%")
`
  }
];

const insertProjectStmt = db.prepare(`
  INSERT INTO projects (student_id, title, description, language, code)
  VALUES (?, ?, ?, ?, ?)
`);

for (const p of sampleProjects) {
  insertProjectStmt.run(p.student_id, p.title, p.description, p.language, p.code);
}
console.log('✅ Sample projects inserted');

// 11. Resumes
const sampleResumeJson = JSON.stringify({
  fullName: 'Alex Chen',
  email: 'alex.chen@student.edu',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  summary: 'Motivated Computer Science undergraduate with proven expertise in building resilient full-stack applications with React, TypeScript, and Node.js. Experienced in algorithms, REST APIs, and modern cloud deployment pipelines.',
  education: [
    {
      institution: 'Apex Institute of Technology',
      degree: 'B.S. in Computer Science',
      year: '2023 - 2027',
      gpa: '3.92 / 4.0'
    }
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'TailwindCSS', 'PostgreSQL', 'Docker', 'Git'],
  experience: [
    {
      role: 'Full-Stack Software Engineering Intern',
      company: 'NovaTech Labs',
      period: 'May 2025 - August 2025',
      bullets: [
        'Engineered responsive dashboards reducing client-side render latencies by 34% with React 18 memoization.',
        'Architected Express.js REST APIs with JWT authentication handling 10k daily requests.',
        'Collaborated in Agile sprints, authored unit tests, and improved CI/CD pipeline reliability.'
      ]
    }
  ],
  projects: [
    {
      title: 'EduPulse AI Analytics Platform',
      technologies: 'React, Vite, Node.js, SQLite, Gemini AI',
      description: 'Integrated intelligent student performance monitoring, automated missed lecture note synthesis, and ATS resume scoring.'
    },
    {
      title: 'Distributed Token Bucket Rate Limiter',
      technologies: 'Python, Redis, Docker',
      description: 'Engineered high-concurrency request throttling preventing server saturation under DDoS simulations.'
    }
  ]
});

db.prepare(`
  INSERT INTO resumes (student_id, content_json, ats_score)
  VALUES (?, ?, ?)
`).run(4, sampleResumeJson, 88);

// 12. Chat Sessions & History initial setup
const insertSessionStmt = db.prepare(`
  INSERT INTO chat_sessions (user_id, title, created_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
`);

const insertChatStmt = db.prepare(`
  INSERT INTO chat_history (session_id, user_id, role, message, created_at)
  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

// Seed sessions for student Alex Chen (ID: 4)
const alexSession1 = insertSessionStmt.run(4, 'Algorithm Complexity & Graph Mentoring');
insertChatStmt.run(
  alexSession1.lastInsertRowid,
  4,
  'user',
  'Can you explain Dijkstra algorithm and how a priority queue optimizes it?'
);
insertChatStmt.run(
  alexSession1.lastInsertRowid,
  4,
  'assistant',
  `### Dijkstra's Shortest Path Algorithm

Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph with non-negative edge weights.

#### Complexity Comparison
- **Naive Array Scan:** $O(V^2)$
- **Min-Heap / Priority Queue:** **$O((V + E) \\log V)$**

\`\`\`python
import heapq

def dijkstra(graph, start):
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    
    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        if curr_dist > distances[curr_node]:
            continue
            
        for neighbor, weight in graph[curr_node].items():
            dist = curr_dist + weight
            if dist < distances[neighbor]:
                distances[neighbor] = dist
                heapq.heappush(pq, (dist, neighbor))
                
    return distances
\`\`\`

Let me know if you would like to explore Bellman-Ford for negative edge weights!`
);

const alexSession2 = insertSessionStmt.run(4, 'React 18 Concurrent Rendering & Memoization');
insertChatStmt.run(
  alexSession2.lastInsertRowid,
  4,
  'user',
  'How does React 18 useTransition help keep interactive dashboards snappy?'
);
insertChatStmt.run(
  alexSession2.lastInsertRowid,
  4,
  'assistant',
  `**React 18 \`useTransition\`** allows you to mark specific state updates as non-urgent transitions. While the transition renders in the background, high-priority user interactions (typing, button clicks) remain completely responsive without freezing the browser thread!`
);

// Seed a session for Rahul Sharma (ID: 8)
const rahulSession = insertSessionStmt.run(8, 'Catching Up on Missed Lectures');
insertChatStmt.run(
  rahulSession.lastInsertRowid,
  8,
  'user',
  'I was absent for the Distributed Systems lecture. What should I review first?'
);
insertChatStmt.run(
  rahulSession.lastInsertRowid,
  8,
  'assistant',
  `Hello Rahul! I checked your attendance and course schedule. You missed **Lecture #4: Consistent Hashing & Replication** in Full-Stack Systems.

1. **Check Missed Notes Tab:** Your handwritten summary has already been synthesized with key formulas and node ring illustrations.
2. **Key Concepts to Master:** Virtual nodes, murmur3 hashing, quorum reads ($R + W > N$).
3. Let me know if you want me to quiz you on partition tolerance!`
);

console.log('✅ Resumes, Chat Sessions, and Chat History seeded');

// 13. Seed 20+ courses across 12 categories, lessons, quizzes, and practice arena problems
const { seedCoursesAndLessons } = require('./seedCoursesAndLessons');
seedCoursesAndLessons();

console.log('✨ All seed data created successfully!');
console.log(`
========================================================================
  EDUPULSE AI — INDIVIDUAL PASSWORDS CREATED (See demo_credentials.txt)
========================================================================
  ADMIN:
  - admin@admin.edu -> Admin@2026#Edu

  TEACHERS:
  - sarah.jenkins@teacher.edu -> Sarah@2026#Prof (4 eligible students >= 80%)
  - david.kumar@teacher.edu -> David@2026#Prof (2 eligible students < 80%)

  STUDENTS:
  - alex.chen@student.edu -> Alex@2026#CS01 (Top student: 94% att, 92% GPA)
  - priya.patel@student.edu -> Priya@2026#AI02
  - rahul.sharma@student.edu -> Rahul@2026#CS05 (Missed notes candidate: 65% att)
  - ava.thomas@student.edu -> Ava@2026#CS10 (Earned certificate)
  - sophia.martinez@student.edu -> Sophia@2026#CS06 (At-risk: 68% att, 58% GPA)
========================================================================
`);
