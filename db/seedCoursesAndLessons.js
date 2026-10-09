const db = require('./database');
const { seedProblems } = require('./seedPracticeProblems');

function seedCoursesAndLessons() {
  console.log('📚 Seeding 20+ comprehensive courses across 12 categories...');

  const allCourses = [
    // 1. Web Development
    {
      id: 1,
      title: 'Full-Stack Web Development',
      description: 'Master modern frontend & backend development with React, Node.js, Express, and REST APIs.',
      teacher_id: 2, // Prof. Sarah Jenkins
      category: 'Web Development',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.9,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 4
    },
    {
      id: 2,
      title: 'Modern React 18 & Next.js Architecture',
      description: 'Concurrent rendering, server components, Suspense, state management patterns, and edge deployments.',
      teacher_id: 2,
      category: 'Web Development',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.95,
      coin_cost: 150,
      is_extra: 1,
      total_lessons: 4
    },

    // 2. Python
    {
      id: 3,
      title: 'Python for Professional Software Engineering',
      description: 'Object-oriented programming, functional idioms, generators, type hints, and pytest automation.',
      teacher_id: 2,
      category: 'Python',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.85,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 3
    },
    {
      id: 4,
      title: 'Advanced Python & AsyncIO High-Throughput Systems',
      description: 'Asynchronous event loops, multiprocessing, GIL mechanics, and concurrent network servers with FastAPI.',
      teacher_id: 2,
      category: 'Python',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.9,
      coin_cost: 180,
      is_extra: 1,
      total_lessons: 3
    },

    // 3. Java
    {
      id: 5,
      title: 'Core Java & Object-Oriented Design',
      description: 'Java fundamentals, JVM architecture, memory management, garbage collection, and collections framework.',
      teacher_id: 2,
      category: 'Java',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.8,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 3
    },
    {
      id: 6,
      title: 'Enterprise Java & Spring Boot Microservices',
      description: 'Production Spring Boot, Spring Security, Hibernate ORM, Kafka event streaming, and Docker deployment.',
      teacher_id: 2,
      category: 'Java',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.92,
      coin_cost: 220,
      is_extra: 1,
      total_lessons: 4
    },

    // 4. Data Structures
    {
      id: 7,
      title: 'Data Structures & Algorithms in Python',
      description: 'Deep dive into computational complexity, graph algorithms, dynamic programming, and interview challenges.',
      teacher_id: 2,
      category: 'Data Structures',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.9,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 4
    },
    {
      id: 8,
      title: 'Competitive Programming & Advanced Algorithms',
      description: 'Segment trees, Fenwick trees, heavy-light decomposition, network flows, and NP-hard problem heuristics.',
      teacher_id: 2,
      category: 'Data Structures',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.97,
      coin_cost: 250,
      is_extra: 1,
      total_lessons: 3
    },

    // 5. DBMS
    {
      id: 9,
      title: 'Relational Databases & SQL Optimization',
      description: 'Relational algebra, schema normalization (3NF/BCNF), B+ Tree index design, and query execution plans.',
      teacher_id: 2,
      category: 'DBMS',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.88,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 3
    },
    {
      id: 10,
      title: 'Distributed Databases, NoSQL & Sharding',
      description: 'Cassandra, MongoDB, consistent hashing, Raft consensus, two-phase commit, and ACID vs BASE trade-offs.',
      teacher_id: 3, // Dr. David Kumar
      category: 'DBMS',
      instructor_name: 'Dr. David Kumar',
      rating: 4.89,
      coin_cost: 200,
      is_extra: 1,
      total_lessons: 3
    },

    // 6. AI/ML
    {
      id: 11,
      title: 'Machine Learning & Neural Networks',
      description: 'Supervised & unsupervised learning, gradient descent, deep neural networks, and computer vision.',
      teacher_id: 3,
      category: 'AI/ML',
      instructor_name: 'Dr. David Kumar',
      rating: 4.9,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 4
    },
    {
      id: 12,
      title: 'Advanced Generative AI & Prompt Engineering',
      description: 'LLM fine-tuning, RAG architectures, vector embeddings, LangChain, and autonomous multi-agent systems.',
      teacher_id: 3,
      category: 'AI/ML',
      instructor_name: 'Dr. David Kumar',
      rating: 4.96,
      coin_cost: 220,
      is_extra: 1,
      total_lessons: 4
    },

    // 7. Cloud
    {
      id: 13,
      title: 'Cloud Computing & DevOps Essentials',
      description: 'Infrastructure as Code, Docker containerization, CI/CD pipelines, and AWS/GCP deployments.',
      teacher_id: 3,
      category: 'Cloud',
      instructor_name: 'Dr. David Kumar',
      rating: 4.84,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 3
    },
    {
      id: 14,
      title: 'AWS Solutions Architect & Kubernetes at Scale',
      description: 'VPC design, IAM policies, EKS cluster orchestration, Helm charts, and multi-region failover.',
      teacher_id: 3,
      category: 'Cloud',
      instructor_name: 'Dr. David Kumar',
      rating: 4.94,
      coin_cost: 280,
      is_extra: 1,
      total_lessons: 3
    },

    // 8. Cybersecurity
    {
      id: 15,
      title: 'Cybersecurity Fundamentals & Network Defense',
      description: 'OSI security models, packet analysis with Wireshark, symmetric/asymmetric cryptography, and firewalls.',
      teacher_id: 2,
      category: 'Cybersecurity',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.87,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 3
    },
    {
      id: 16,
      title: 'Ethical Hacking & Web Penetration Testing',
      description: 'OWASP Top 10 exploits, SQL injection, XSS, CSRF, privilege escalation, and security auditing.',
      teacher_id: 2,
      category: 'Cybersecurity',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.91,
      coin_cost: 240,
      is_extra: 1,
      total_lessons: 3
    },

    // 9. UI/UX
    {
      id: 17,
      title: 'UI/UX Design Systems & Figma Prototyping',
      description: 'Typography hierarchy, color tokens, responsive auto-layout, atomic design methodology, and accessibility (WCAG).',
      teacher_id: 3,
      category: 'UI/UX',
      instructor_name: 'Dr. David Kumar',
      rating: 4.86,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 3
    },
    {
      id: 18,
      title: 'Advanced Product Design & User Research',
      description: 'Usability testing, heuristic evaluations, micro-interactions, journey mapping, and design sprint facilitation.',
      teacher_id: 3,
      category: 'UI/UX',
      instructor_name: 'Dr. David Kumar',
      rating: 4.89,
      coin_cost: 160,
      is_extra: 1,
      total_lessons: 3
    },

    // 10. Aptitude
    {
      id: 19,
      title: 'Quantitative Aptitude & Placement Foundations',
      description: 'Number theory, percentages, profit & loss, time and work, permutations, combinations, and probability.',
      teacher_id: 3,
      category: 'Aptitude',
      instructor_name: 'Dr. David Kumar',
      rating: 4.82,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 3
    },
    {
      id: 20,
      title: 'Advanced Logical Reasoning & Data Interpretation',
      description: 'Syllogisms, blood relations, seating arrangements, matrix grids, charts interpretation, and caselets.',
      teacher_id: 3,
      category: 'Aptitude',
      instructor_name: 'Dr. David Kumar',
      rating: 4.85,
      coin_cost: 110,
      is_extra: 1,
      total_lessons: 3
    },

    // 11. Communication Skills
    {
      id: 21,
      title: 'Professional Engineering Communication & Pitching',
      description: 'Technical writing, executive architectural summaries, team conflict resolution, and demo presentations.',
      teacher_id: 3,
      category: 'Communication Skills',
      instructor_name: 'Dr. David Kumar',
      rating: 4.88,
      coin_cost: 0,
      is_extra: 0,
      total_lessons: 3
    },

    // 12. Interview Prep
    {
      id: 22,
      title: 'System Design & Distributed Architectures',
      description: 'High-availability microservices, distributed caches, sharding, message queues, and fault tolerance.',
      teacher_id: 2,
      category: 'Interview Prep',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.96,
      coin_cost: 250,
      is_extra: 1,
      total_lessons: 4
    },
    {
      id: 23,
      title: 'FAANG Tech Interview & Coding Simulation',
      description: 'Mock whiteboarding, behavioral STAR interviews, complexity optimization, and live technical challenge drills.',
      teacher_id: 2,
      category: 'Interview Prep',
      instructor_name: 'Prof. Sarah Jenkins',
      rating: 4.98,
      coin_cost: 300,
      is_extra: 1,
      total_lessons: 3
    }
  ];

  for (const c of allCourses) {
    const existing = db.prepare('SELECT id FROM courses WHERE id = ?').get(c.id);
    if (existing) {
      db.prepare(`
        UPDATE courses 
        SET title = ?, description = ?, teacher_id = ?, category = ?, instructor_name = ?, rating = ?, coin_cost = ?, is_extra = ?, total_lessons = ?
        WHERE id = ?
      `).run(c.title, c.description, c.teacher_id, c.category, c.instructor_name, c.rating, c.coin_cost, c.is_extra, c.total_lessons, c.id);
    } else {
      db.prepare(`
        INSERT INTO courses (id, title, description, teacher_id, category, instructor_name, rating, coin_cost, is_extra, total_lessons)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(c.id, c.title, c.description, c.teacher_id, c.category, c.instructor_name, c.rating, c.coin_cost, c.is_extra, c.total_lessons);
    }
  }

  console.log(`✅ ${allCourses.length} Courses verified across all 12 categories!`);

  // Seed interactive lessons and quizzes for courses
  console.log('📖 Seeding interactive lessons and quizzes...');
  const sampleLessons = [
    // Course 1: Full-Stack Web Development
    {
      course_id: 1,
      lesson_order: 1,
      title: 'Modern React Architecture & Component State',
      duration_minutes: 20,
      content: `### Modern React Architecture & Unidirectional Data Flow

React 18 introduces concurrent features that redefine how applications render state transitions.

#### Core Principles:
1. **Unidirectional Data Flow**: State flows strictly down from parent to child via props.
2. **Pure Components**: A component should render identical output for identical props and state without mutating global variables.
3. **Immutability**: Never mutate state objects directly. Always return new references using spread operators (\`{ ...state, updated: true }\`).

\`\`\`javascript
// Recommended pattern for state updates:
const [count, setCount] = useState(0);
const increment = () => setCount(prev => prev + 1);
\`\`\``,
      quiz_question: 'What is the primary benefit of immutability in React component state?',
      quiz_option_a: 'It speeds up garbage collection automatically',
      quiz_option_b: 'It allows React to perform fast shallow equality checks (===) to determine re-renders',
      quiz_option_c: 'It converts components into pure Web Workers',
      quiz_option_d: 'It prevents JavaScript closures from accessing previous variables',
      correct_option: 'B'
    },
    {
      course_id: 1,
      lesson_order: 2,
      title: 'Building Resilient Express REST APIs',
      duration_minutes: 25,
      content: `### Building Resilient Express REST APIs

An effective REST API enforces idempotence, centralized error handling, and robust middleware pipelines.

#### Middleware Pipeline:
1. **CORS & Body Parsers**: Configure security headers and parse JSON payloads.
2. **Authentication Guard**: Verify incoming JWT Bearer tokens before reaching controllers.
3. **Global Error Handler**: Always pass unexpected exceptions to \`next(err)\` to avoid unhandled promise rejections.

\`\`\`javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});
\`\`\``,
      quiz_question: 'Which HTTP method should be idempotent according to the REST specification?',
      quiz_option_a: 'POST',
      quiz_option_b: 'PATCH',
      quiz_option_c: 'PUT',
      quiz_option_d: 'CONNECT',
      correct_option: 'C'
    },
    {
      course_id: 1,
      lesson_order: 3,
      title: 'Database Transactions & Integrity Constraints',
      duration_minutes: 20,
      content: `### Database Transactions & ACID Guarantees

When modifying related tables, always execute queries inside atomic transactions.

#### ACID Properties:
- **Atomicity**: All statements succeed or none do.
- **Consistency**: Invariants and foreign key constraints remain valid.
- **Isolation**: Intermediate uncommitted states remain invisible to concurrent queries.
- **Durability**: Committed data survives system crashes.`,
      quiz_question: 'What happens if an error is thrown inside a database transaction block?',
      quiz_option_a: 'The database saves only the queries that ran before the error',
      quiz_option_b: 'All changes within the transaction block are rolled back atomically',
      quiz_option_c: 'The table is locked permanently until manual admin intervention',
      quiz_option_d: 'The database triggers a background reboot',
      correct_option: 'B'
    },
    {
      course_id: 1,
      lesson_order: 4,
      title: 'Capstone Assessment & Production Deployment',
      duration_minutes: 30,
      content: `### Capstone Assessment & Production Deployment

Final milestone covering automated test suites, environment variables, reverse proxies, and health monitoring.`,
      quiz_question: 'Why should database credentials and API secrets NEVER be hardcoded into client-side code?',
      quiz_option_a: 'Because JavaScript cannot parse string passwords longer than 16 bytes',
      quiz_option_b: 'Because client code is bundled into browser assets and fully visible in DevTools',
      quiz_option_c: 'Because CORS headers will reject any request with an environment key',
      quiz_option_d: 'Because React compilers strip all variable assignments on build',
      correct_option: 'B'
    },

    // Course 2: React 18 & Next.js Architecture
    {
      course_id: 2,
      lesson_order: 1,
      title: 'React 18 Concurrent Features & useTransition',
      duration_minutes: 25,
      content: `### Concurrent Rendering & State Prioritization

React 18 allows developers to differentiate between urgent updates and non-urgent transitions.`,
      quiz_question: 'Which hook marks state transitions as non-blocking and interruptible by user keystrokes?',
      quiz_option_a: 'useEffect',
      quiz_option_b: 'useTransition',
      quiz_option_c: 'useRef',
      quiz_option_d: 'useImperativeHandle',
      correct_option: 'B'
    },
    {
      course_id: 2,
      lesson_order: 2,
      title: 'Server Components vs Client Components',
      duration_minutes: 25,
      content: `### React Server Components (RSC)

Server components render exclusively on the server and do not ship JavaScript bytes to the client browser.`,
      quiz_question: 'Can a React Server Component directly use the useState or useEffect hooks?',
      quiz_option_a: 'Yes, with the "use server" directive',
      quiz_option_b: 'No, interactive hooks require a "use client" component boundary',
      quiz_option_c: 'Yes, if wrapped in Suspense',
      quiz_option_d: 'Yes, in production mode only',
      correct_option: 'B'
    },

    // Course 7: Data Structures & Algorithms
    {
      course_id: 7,
      lesson_order: 1,
      title: 'Asymptotic Analysis & Big-O Invariants',
      duration_minutes: 20,
      content: `### Time and Space Complexity Analysis

Big-O describes the upper bound limiting the growth rate of runtime as input size $N$ increases.`,
      quiz_question: 'What is the average time complexity of searching for an element in a balanced Hash Table?',
      quiz_option_a: 'O(N)',
      quiz_option_b: 'O(log N)',
      quiz_option_c: 'O(1)',
      quiz_option_d: 'O(N log N)',
      correct_option: 'C'
    },
    {
      course_id: 7,
      lesson_order: 2,
      title: 'Two Pointers & Sliding Window Patterns',
      duration_minutes: 25,
      content: `### Optimal Subarray & Substring Techniques

The sliding window pattern converts $O(N^2)$ brute-force window checks into linear $O(N)$ execution.`,
      quiz_question: 'When is the two-pointer technique most naturally applicable for finding a pair sum?',
      quiz_option_a: 'When the array is unordered with negative numbers',
      quiz_option_b: 'When the array is already sorted in non-decreasing order',
      quiz_option_c: 'When searching a circular linked list',
      quiz_option_d: 'When the elements are binary strings',
      correct_option: 'B'
    },

    // Course 11: Machine Learning & Neural Networks
    {
      course_id: 11,
      lesson_order: 1,
      title: 'Gradient Descent & Cost Functions',
      duration_minutes: 25,
      content: `### Foundations of Optimization in Deep Learning

Gradient descent iteratively updates weights in the direction opposite to the gradient vector of the loss function.`,
      quiz_question: 'What happens if the learning rate (alpha) is set too high during gradient descent?',
      quiz_option_a: 'The weights converge instantly to the global optimum',
      quiz_option_b: 'The loss oscillates wildly and may diverge without reaching a minimum',
      quiz_option_c: 'The gradient vector becomes strictly zero',
      quiz_option_d: 'Backpropagation stops computing matrix multiplications',
      correct_option: 'B'
    },

    // Course 12: Advanced Generative AI
    {
      course_id: 12,
      lesson_order: 1,
      title: 'Transformer Architecture & Self-Attention',
      duration_minutes: 30,
      content: `### Self-Attention: The Engine of Large Language Models

Attention computes compatibility scores between Query and Key vectors to generate weighted combinations of Value vectors.`,
      quiz_question: 'In the formula Attention(Q, K, V), why do we divide by sqrt(d_k)?',
      quiz_option_a: 'To force weights to become negative numbers',
      quiz_option_b: 'To prevent large dot products from pushing the softmax function into regions with tiny gradients',
      quiz_option_c: 'To eliminate the need for multi-head projections',
      quiz_option_d: 'To convert word vectors into integer ASCII codes',
      correct_option: 'B'
    }
  ];

  // Insert or update sample lessons
  for (const l of sampleLessons) {
    const existing = db.prepare('SELECT id FROM lessons WHERE course_id = ? AND lesson_order = ?').get(l.course_id, l.lesson_order);
    if (!existing) {
      db.prepare(`
        INSERT INTO lessons (course_id, lesson_order, title, content, duration_minutes, quiz_question, quiz_option_a, quiz_option_b, quiz_option_c, quiz_option_d, correct_option)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(l.course_id, l.lesson_order, l.title, l.content, l.duration_minutes, l.quiz_question, l.quiz_option_a, l.quiz_option_b, l.quiz_option_c, l.quiz_option_d, l.correct_option);
    }
  }

  // Ensure every other course has at least 2 default structured lessons so lesson player always functions
  for (const c of allCourses) {
    const count = db.prepare('SELECT COUNT(*) AS c FROM lessons WHERE course_id = ?').get(c.id)?.c || 0;
    if (count === 0) {
      db.prepare(`
        INSERT INTO lessons (course_id, lesson_order, title, content, duration_minutes, quiz_question, quiz_option_a, quiz_option_b, quiz_option_c, quiz_option_d, correct_option)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        c.id,
        1,
        `Foundations of ${c.title}`,
        `### Foundations of ${c.title}\n\nWelcome to this comprehensive module on **${c.title}** in the **${c.category}** track.\n\n#### Key Objectives:\n1. Understand foundational principles and architecture.\n2. Master standard industry workflows and design patterns.\n3. Prepare for real-world certification assessments.`,
        20,
        `What is the primary industry standard goal when studying ${c.category}?`,
        'Memorizing syntax without building practical projects',
        'Applying structured design principles to build scalable production solutions',
        'Avoiding version control and automated testing',
        'Running applications strictly in local development environments',
        'B'
      );

      db.prepare(`
        INSERT INTO lessons (course_id, lesson_order, title, content, duration_minutes, quiz_question, quiz_option_a, quiz_option_b, quiz_option_c, quiz_option_d, correct_option)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        c.id,
        2,
        `Practical Applications & Capstone for ${c.title}`,
        `### Practical Implementation in ${c.title}\n\nIn this advanced lesson, we examine hands-on implementations, algorithmic trade-offs, and production monitoring.`,
        25,
        'Which engineering practice ensures reliable deployments and high system availability?',
        'Automated CI/CD pipelines and comprehensive regression testing',
        'Manual database updates on live production clusters during peak hours',
        'Disabling server activity logging to save disk space',
        'Hardcoding secret API keys in public repositories',
        'A'
      );
    }
  }

  console.log('✅ Interactive course lessons and quizzes seeded!');

  // Seed Multi-Page Handwritten Notes (3-5 pages per missed class session)
  console.log('📝 Seeding multi-page handwritten class notes...');
  const multiPageNotes = [
    // Missed Class 1: Course 1, Date 2026-09-12 (Rahul Sharma was absent)
    {
      course_id: 1,
      class_date: '2026-09-12',
      page_number: 1,
      title: 'Topic Overview: React 18 Lifecycle & Hooks',
      content: `## Lecture #3: React Component Lifecycle & Hooks

### 📌 Session Overview
Today Prof. Sarah Jenkins broke down component rendering phases:
- **Mounting Phase**: Component is initialized and injected into the DOM tree.
- **Updating Phase**: Component re-renders upon state or prop changes.
- **Unmounting Phase**: Component is cleaned up to prevent memory leaks.

*Key Invariant*: Never call hooks inside conditional \`if\` statements or nested loops!`,
      svg_diagram: null,
      is_revised: 1
    },
    {
      course_id: 1,
      class_date: '2026-09-12',
      page_number: 2,
      title: 'Core Concepts: Dependency Arrays & Memoization',
      content: `## Invariant Laws of useEffect

### 💡 The Dependency Array Rule
Every value referenced inside the effect closure must appear in the dependency array:
\`\`\`javascript
useEffect(() => {
  const handler = (e) => console.log(e.key);
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []); // Empty array = mount/unmount only
\`\`\`

1. Missing dependencies cause **stale closures** that hold onto outdated variable values.
2. Memoize function references with \`useCallback\` when passing them down to memoized children.`,
      svg_diagram: null,
      is_revised: 1
    },
    {
      course_id: 1,
      class_date: '2026-09-12',
      page_number: 3,
      title: 'Worked Implementation: Custom Hook Pattern',
      content: `## Building a Resilient useFetch Hook

\`\`\`javascript
import { useState, useEffect } from 'react';

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
\`\`\`

*Notice how AbortController cancels network requests when component unmounts!*`,
      svg_diagram: null,
      is_revised: 0
    },
    {
      course_id: 1,
      class_date: '2026-09-12',
      page_number: 4,
      title: 'Architectural Lifecycle Diagram',
      content: `## Visualizing the React Hook Lifecycle Flow

Below is the state mutation pipeline discussed on the whiteboard:`,
      svg_diagram: `<svg viewBox="0 0 540 160" xmlns="http://www.w3.org/2000/svg" class="w-full max-w-lg mx-auto">
  <rect x="20" y="45" width="110" height="70" rx="10" fill="#4f46e5" />
  <text x="75" y="82" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">State Change</text>
  <text x="75" y="98" fill="#c7d2fe" font-size="10" text-anchor="middle" font-family="sans-serif">setCount()</text>

  <line x1="130" y1="80" x2="190" y2="80" stroke="#4f46e5" stroke-width="3" />
  <polygon points="190,75 200,80 190,85" fill="#4f46e5" />

  <rect x="200" y="45" width="130" height="70" rx="10" fill="#1e293b" stroke="#6366f1" stroke-width="2" />
  <text x="265" y="82" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">Virtual DOM Diff</text>
  <text x="265" y="98" fill="#94a3b8" font-size="10" text-anchor="middle" font-family="sans-serif">Reconciliation</text>

  <line x1="330" y1="80" x2="390" y2="80" stroke="#059669" stroke-width="3" />
  <polygon points="390,75 400,80 390,85" fill="#059669" />

  <rect x="400" y="45" width="120" height="70" rx="10" fill="#059669" />
  <text x="460" y="82" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">DOM Commit</text>
  <text x="460" y="98" fill="#d1fae5" font-size="10" text-anchor="middle" font-family="sans-serif">useEffect Trigger</text>
</svg>`,
      is_revised: 0
    },
    {
      course_id: 1,
      class_date: '2026-09-12',
      page_number: 5,
      title: '5 Revision Questions for Exam Prep',
      content: `## 5 Revision Questions

1. **Question 1**: What happens if an async function is passed directly to \`useEffect\` instead of calling an inner async function?
2. **Question 2**: Explain why \`useCallback\` with an empty dependency array returns the exact same function reference on every re-render.
3. **Question 3**: In what scenario would an \`AbortController\` be necessary inside a React component?
4. **Question 4**: Distinguish between \`useMemo\` and \`useCallback\`.
5. **Question 5**: What is the purpose of the cleanup return callback in \`useEffect\`?

*Ask the AI Mentor to verify your answers!*`,
      svg_diagram: null,
      is_revised: 0
    }
  ];

  for (const n of multiPageNotes) {
    const existing = db.prepare(`
      SELECT id FROM class_notes WHERE course_id = ? AND class_date = ? AND page_number = ?
    `).get(n.course_id, n.class_date, n.page_number);

    if (existing) {
      db.prepare(`
        UPDATE class_notes 
        SET title = ?, content = ?, svg_diagram = ?, is_revised = ?
        WHERE id = ?
      `).run(n.title, n.content, n.svg_diagram, n.is_revised, existing.id);
    } else {
      db.prepare(`
        INSERT INTO class_notes (course_id, class_date, page_number, title, content, svg_diagram, is_revised)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(n.course_id, n.class_date, n.page_number, n.title, n.content, n.svg_diagram, n.is_revised);
    }
  }

  console.log('✅ Multi-page handwritten notebook notes seeded!');

  // Seed Practice Arena problems (invoke 40 problems seeder)
  seedProblems();

  // Seed initial submissions & performance history for students so charts look rich
  console.log('📊 Seeding initial practice submissions and performance trends...');
  const studentIds = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const insertSubStmt = db.prepare(`
    INSERT INTO submissions (student_id, problem_id, language, code, status, passed, total, runtime_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPerfHistStmt = db.prepare(`
    INSERT INTO performance_history (student_id, score, test_part, coding_part, course_part, attendance_part, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Initial submissions for top student Alex Chen (ID: 4)
  const alexProblems = [
    { id: 1, lang: 'python', status: 'Accepted', passed: 4, total: 4, ms: 38 },
    { id: 2, lang: 'javascript', status: 'Accepted', passed: 3, total: 3, ms: 42 },
    { id: 3, lang: 'python', status: 'Accepted', passed: 3, total: 3, ms: 35 },
    { id: 21, lang: 'python', status: 'Accepted', passed: 3, total: 3, ms: 55 },
    { id: 22, lang: 'javascript', status: 'Accepted', passed: 4, total: 4, ms: 60 },
    { id: 31, lang: 'python', status: 'Accepted', passed: 3, total: 3, ms: 88 }
  ];

  for (const ap of alexProblems) {
    const existing = db.prepare('SELECT id FROM submissions WHERE student_id = ? AND problem_id = ?').get(4, ap.id);
    if (!existing) {
      insertSubStmt.run(4, ap.id, ap.lang, '# Optimal implementation verified\n', ap.status, ap.passed, ap.total, ap.ms, '2026-10-02 15:00:00');
    }
  }

  // Seed initial submissions for other students
  for (const sId of studentIds) {
    if (sId !== 4) {
      const existing = db.prepare('SELECT id FROM submissions WHERE student_id = ?').get(sId);
      if (!existing) {
        insertSubStmt.run(sId, 1, 'javascript', '// Two sum solution\n', 'Accepted', 4, 4, 45, '2026-10-01 14:00:00');
      }
    }
  }

  // Seed historical trend data points for each student
  for (const sId of studentIds) {
    const histCount = db.prepare('SELECT COUNT(*) AS c FROM performance_history WHERE student_id = ?').get(sId)?.c || 0;
    if (histCount === 0) {
      const baseScore = sId === 4 ? 90 : (sId === 9 ? 60 : 80);
      for (let day = 10; day >= 1; day -= 2) {
        const d = new Date();
        d.setDate(d.getDate() - day);
        const dateStr = d.toISOString().slice(0, 19).replace('T', ' ');
        const scoreVal = Math.min(98, Math.max(50, baseScore + (10 - day) + (sId % 3)));
        insertPerfHistStmt.run(
          sId,
          scoreVal,
          scoreVal + 2,
          scoreVal - 2,
          scoreVal + 1,
          scoreVal,
          dateStr
        );
      }
    }
  }

  console.log('✅ Practice submissions and performance history trends verified!');
}

module.exports = { seedCoursesAndLessons };

if (require.main === module) {
  seedCoursesAndLessons();
}
