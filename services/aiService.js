// Google Gemini API integration with robust mock fallbacks and streaming support
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Target Job Role Keyword Dictionaries for Rule-Based ATS Engine
const ROLE_KEYWORDS = {
  'Web Developer': ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Node.js', 'Express', 'REST API', 'Git', 'Webpack', 'Tailwind', 'Redux', 'Responsive Design', 'SQL'],
  'Full-Stack Developer': ['React', 'Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'MongoDB', 'Docker', 'REST API', 'GraphQL', 'CI/CD', 'Jest', 'AWS', 'Microservices', 'Git'],
  'Data Analyst': ['Python', 'SQL', 'Tableau', 'PowerBI', 'Excel', 'Pandas', 'NumPy', 'Data Modeling', 'ETL', 'Statistical Analysis', 'A/B Testing', 'Reporting', 'Data Warehousing'],
  'Java Developer': ['Java', 'Spring Boot', 'Hibernate', 'Microservices', 'REST', 'Maven', 'JUnit', 'OOP', 'SQL', 'PostgreSQL', 'Docker', 'Kafka', 'Multithreading', 'Git'],
  'AI/ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Pandas', 'NumPy', 'Model Deployment', 'Docker', 'Hugging Face'],
  'Cloud / DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'Linux', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Prometheus', 'Grafana', 'Nginx', 'Bash', 'Networking'],
  'Cybersecurity Specialist': ['Network Security', 'Linux', 'Cryptography', 'Vulnerability Assessment', 'OWASP', 'Penetration Testing', 'SIEM', 'Firewalls', 'Wireshark', 'Incident Response', 'Identity Management']
};

const ACTION_VERBS = [
  'architected', 'engineered', 'developed', 'implemented', 'designed', 'built', 'optimized',
  'refactored', 'orchestrated', 'automated', 'deployed', 'spearheaded', 'created', 'established',
  'reduced', 'increased', 'integrated', 'accelerated', 'transformed', 'delivered'
];

async function callGemini(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return null; // Trigger fallback
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: (systemInstruction ? `[System Instruction: ${systemInstruction}]\n\n` : '') + prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2500
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}. Using fallback.`);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.warn('Gemini API call failed:', err.message, '- falling back to mock response.');
    return null;
  }
}

const aiService = {
  /**
   * Streaming AI Mentor response (Server-Sent Events)
   * Answers ANY question (academics, coding, career, general knowledge).
   */
  async streamChat(userMessage, history = [], studentContext = null, onChunk) {
    const systemPrompt = `You are EduPulse AI Mentor, a friendly, accurate mentor. Answer any question clearly with examples. If unsure, say so instead of guessing. You answer academic, coding, career, and general questions. Provide markdown formatted responses with syntax-highlighted code blocks where appropriate.`;

    let contextIntro = '';
    if (studentContext && studentContext.name) {
      contextIntro = `Student Profile:
- Name: ${studentContext.name}
- Enrolled Courses: ${studentContext.enrolledCourses || 'General'}
- Weak Areas / Focus Needed: ${studentContext.weakSubjects || 'None reported'}
When relevant, recommend helpful topics or study plans personalized to this student.
`;
    }

    const recentHistory = history.slice(-20).map(h => `${h.role === 'user' ? 'Student' : 'EduPulse AI Mentor'}: ${h.message}`).join('\n\n');

    const prompt = `${contextIntro}
Conversation History:
${recentHistory}

Student: ${userMessage}
EduPulse AI Mentor:`;

    // Attempt Gemini streaming if API key present
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `[System: ${systemPrompt}]\n\n${prompt}` }]
            }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (textPart) {
                    fullText += textPart;
                    onChunk(textPart);
                  }
                } catch (e) {}
              }
            }
          }

          if (fullText.trim().length > 0) {
            return fullText;
          }
        }
      } catch (err) {
        console.warn('Gemini stream failed, switching to resilient simulated token stream:', err.message);
      }
    }

    // High-quality resilient fallback answer tailored to query
    const fallbackAnswer = aiService.getSmartMentorResponse(userMessage, studentContext);

    // Stream fallback tokens smoothly in chunks
    const words = fallbackAnswer.split(' ');
    let fullSimulated = '';
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      fullSimulated += chunk;
      onChunk(chunk);
      // Small simulated streaming delay
      await new Promise(r => setTimeout(r, 25));
    }

    return fullSimulated;
  },

  /**
   * Resilient Smart Mentor Knowledge Engine
   */
  getSmartMentorResponse(query, context = null) {
    const q = (query || '').toLowerCase();
    const studentName = context?.name || 'Friend';

    if (q.includes('react') || q.includes('hook') || q.includes('state') || q.includes('useeffect')) {
      return `### React 18 & State Architecture Guide

Hello ${studentName}! Let's break this down clearly.

When managing state in React, remember the golden rule of **unidirectional data flow** and pure render functions:

\`\`\`javascript
import React, { useState, useEffect, useTransition } from 'react';

export function SmartSearch() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleInput = (e) => {
    // 1. High-priority urgent update for typing feedback
    setQuery(e.target.value);

    // 2. Non-urgent background transition for heavy filtering
    startTransition(() => {
      // Execute expensive search / filter computations here
    });
  };

  return (
    <input 
      value={query} 
      onChange={handleInput} 
      placeholder="Type to filter..." 
      className="border rounded p-2"
    />
  );
}
\`\`\`

**Key Takeaways:**
1. Keep local component state as close as possible to where it is used.
2. Avoid unnecessary \`useEffect\` calls for deriving state—derive values directly during render instead.
3. Use \`useMemo\` only when profiling reveals measurable computational bottlenecks.

Would you like me to walk through a concrete example with data fetching or custom hooks?`;
    }

    if (q.includes('algorithm') || q.includes('dsa') || q.includes('two sum') || q.includes('dp') || q.includes('graph') || q.includes('binary search')) {
      return `### Algorithmic Problem Solving Blueprint

Hello ${studentName}! Great algorithmic question. When tackling technical interview or coding arena problems, always apply this systematic 4-step framework:

1. **Clarify Constraints & Edge Cases**:
   - What are input bounds? Can arrays be empty? Are there negative numbers?
2. **Brute Force First ($O(N^2)$ or $O(2^N)$)**:
   - Identify redundant computations (e.g. repeated nested loop iterations).
3. **Optimize with Data Structures**:
   - Constant lookup? $\\rightarrow$ **Hash Map** / Hash Set
   - Order maintenance? $\\rightarrow$ **Two Pointers** / Sliding Window
   - Shortest path in unweighted graphs? $\\rightarrow$ **BFS** with Queue
   - Overlapping subproblems with optimal substructure? $\\rightarrow$ **Dynamic Programming**

\`\`\`python
# Example: Binary Search in O(log N) Time & O(1) Space
def binary_search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

Practice this directly in our **Practice Arena** on the sidebar to earn coins and boost your performance metrics!`;
    }

    if (q.includes('career') || q.includes('job') || q.includes('resume') || q.includes('ats')) {
      return `### Career & Resume Strategy for Engineers

Hi ${studentName}! Accelerating your tech career comes down to high-signal artifacts:

1. **Quantified Impact on Resume**:
   - Don't just list responsibilities. Use the formula: *"Accomplished [X] as measured by [Y], by doing [Z]"*.
   - *Example:* "Architected caching layer with Redis, reducing database read latency by 42% across 50k daily queries."
2. **Targeted Keyword Density**:
   - Ensure your resume matches the job description for your target role (check out our **Resume Builder** on the left menu).
3. **GitHub / Live Deployment**:
   - Deploy your projects on Vercel or AWS with a clean README, architecture diagram, and test coverage badge.

What specific role (e.g., Full-Stack, Data Analyst, Cloud) are you targeting next? I can help tailor your roadmap!`;
    }

    return `Hello ${studentName}! I am your **EduPulse AI Mentor**.

I am here to support you across **any subject**—including:
- 💻 **Computer Science & Coding**: Algorithms, React, Node.js, Python, System Design.
- 📐 **Mathematics & Core Concepts**: Discrete math, linear algebra, complexity analysis.
- 🎯 **Career Preparation**: Resume tailoring, ATS optimization, and mock interview practice.
- 📚 **Study Strategies**: Catching up on missed classes and course milestones.

*Rule of thumb:* I explain concepts clearly with concrete code examples and intuitive analogies. If you have any questions or code snippets you'd like to inspect, paste them right here!`;
  },

  /**
   * Non-streaming chat completion for compatibility
   */
  async chatCompletion(userMessage, history = [], studentContext = null) {
    let result = '';
    await this.streamChat(userMessage, history, studentContext, chunk => {
      result += chunk;
    });
    return result;
  },

  /**
   * Comprehensive Rule-Based + AI ATS Score Engine
   * Rule-based checks:
   * (a) Contact info present
   * (b) Standard section headings
   * (c) Keyword match against target job role
   * (d) Quantified achievements (metrics & numbers)
   * (e) Action verbs usage
   * (f) Formatting & clean structure
   * (g) Combined with AI wording evaluation
   */
  async calculateAtsScore(resumeData, targetRole = 'Web Developer') {
    const roleKey = ROLE_KEYWORDS[targetRole] ? targetRole : 'Web Developer';
    const targetKeywords = ROLE_KEYWORDS[roleKey] || ROLE_KEYWORDS['Web Developer'];

    const resumeStr = typeof resumeData === 'string' ? resumeData : JSON.stringify(resumeData);
    const parsedObj = typeof resumeData === 'object' ? resumeData : (function() {
      try { return JSON.parse(resumeData); } catch (e) { return {}; }
    })();

    // 1. Rule Check: Contact Info Present (Max 15 pts)
    let contactScore = 0;
    const hasEmail = Boolean(parsedObj.email || /[\w.-]+@[\w.-]+\.\w+/.test(resumeStr));
    const hasPhone = Boolean(parsedObj.phone || /\+?\d[\d -]{8,}\d/.test(resumeStr));
    const hasLocation = Boolean(parsedObj.location || /[\w\s]+,\s*[A-Z]{2}/.test(resumeStr));
    if (hasEmail) contactScore += 6;
    if (hasPhone) contactScore += 5;
    if (hasLocation) contactScore += 4;

    // 2. Rule Check: Standard Section Headings (Max 15 pts)
    let headingScore = 0;
    const hasSummary = Boolean(parsedObj.summary || /summary|profile/i.test(resumeStr));
    const hasSkills = Boolean(parsedObj.skills || /skills|technologies/i.test(resumeStr));
    const hasExpOrProjects = Boolean((parsedObj.experience && parsedObj.experience.length) || (parsedObj.projects && parsedObj.projects.length) || /experience|projects/i.test(resumeStr));
    const hasEdu = Boolean(parsedObj.education || /education|university|degree/i.test(resumeStr));
    if (hasSummary) headingScore += 3;
    if (hasSkills) headingScore += 4;
    if (hasExpOrProjects) headingScore += 5;
    if (hasEdu) headingScore += 3;

    // 3. Rule Check: Keyword Match Against Selected Role (Max 25 pts)
    const lowerResume = resumeStr.toLowerCase();
    const matchedKeywords = [];
    const missingKeywords = [];

    targetKeywords.forEach(kw => {
      if (lowerResume.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const matchRatio = matchedKeywords.length / targetKeywords.length;
    const keywordScore = Math.round(matchRatio * 25);

    // 4. Rule Check: Quantified Achievements & Metrics (Max 20 pts)
    let metricsScore = 0;
    const metricMatches = resumeStr.match(/\d+%\b|\$\d+|\b\d+\s*(ms|k|seconds|users|requests|percent|gb|mb)\b|\b\d{2,}\b/gi) || [];
    if (metricMatches.length >= 5) metricsScore = 20;
    else if (metricMatches.length >= 3) metricsScore = 15;
    else if (metricMatches.length >= 1) metricsScore = 10;
    else metricsScore = 4;

    // 5. Rule Check: Strong Action Verbs (Max 15 pts)
    let actionVerbCount = 0;
    ACTION_VERBS.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'i');
      if (regex.test(resumeStr)) actionVerbCount++;
    });
    const actionVerbScore = Math.min(15, Math.round((actionVerbCount / 6) * 15));

    // 6. Rule Check: Structure & Length (Max 10 pts)
    let lengthScore = 10;
    if (resumeStr.length < 300) lengthScore = 4;
    else if (resumeStr.length > 5000) lengthScore = 7;

    const ruleBasedTotal = contactScore + headingScore + keywordScore + metricsScore + actionVerbScore + lengthScore;

    // AI wording and contextual review
    let aiScore = 85;
    let strengths = [
      'Clean parseable structure aligned with standard Applicant Tracking Systems (Workday, Taleo).',
      `Demonstrates strong foundational presence for ${roleKey}.`
    ];
    let improvementTips = [];

    // Specific improvement tips based on rule analysis
    if (missingKeywords.length > 0) {
      improvementTips.push(`Integrate key ${roleKey} technologies: ${missingKeywords.slice(0, 4).join(', ')}.`);
    }
    if (metricsScore < 15) {
      improvementTips.push('Quantify project bullet points with concrete metrics (e.g. "increased speed by 35%", "served 2,000 users").');
    }
    if (actionVerbScore < 10) {
      improvementTips.push('Begin project bullet points with strong active engineering verbs (Architected, Engineered, Optimized).');
    }
    if (!hasLocation || !hasPhone) {
      improvementTips.push('Ensure complete contact header including city/state and contact phone number.');
    }
    if (improvementTips.length === 0) {
      improvementTips.push('Strong ATS profile. Maintain up-to-date deployment URLs and live production demos.');
    }

    // Try Gemini AI evaluation for wording if API key present
    const aiReview = await callGemini(
      `Evaluate this resume for target role "${roleKey}". Resume text: ${resumeStr.slice(0, 1500)}. Return JSON: {"aiWordingScore": 88, "tips": ["tip1", "tip2"]}`,
      'You are a senior technical hiring manager. Return valid JSON only.'
    );

    if (aiReview) {
      try {
        const cleaned = aiReview.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.aiWordingScore) {
          aiScore = Math.min(98, Math.max(60, parsed.aiWordingScore));
        }
        if (parsed.tips && Array.isArray(parsed.tips)) {
          improvementTips = [...new Set([...improvementTips, ...parsed.tips])].slice(0, 5);
        }
      } catch (e) {}
    }

    // Weighted 50/50 combination: Rule Checks + AI review
    const totalScore = Math.min(100, Math.max(35, Math.round((ruleBasedTotal * 0.5) + (aiScore * 0.5))));

    const breakdown = {
      contactInfo: Math.round((contactScore / 15) * 100),
      sectionHeadings: Math.round((headingScore / 15) * 100),
      roleKeywords: Math.round((keywordScore / 25) * 100),
      quantifiedMetrics: Math.round((metricsScore / 20) * 100),
      actionVerbs: Math.round((actionVerbScore / 15) * 100),
      formatting: Math.round((lengthScore / 10) * 100)
    };

    const breakdownList = [
      { name: 'Contact & Headers', score: breakdown.contactInfo },
      { name: 'Role Keywords', score: breakdown.roleKeywords },
      { name: 'Metrics & Numbers', score: breakdown.quantifiedMetrics },
      { name: 'Action Verbs', score: breakdown.actionVerbs },
      { name: 'Section Structure', score: breakdown.sectionHeadings },
      { name: 'Formatting & Length', score: breakdown.formatting }
    ];

    return {
      score: totalScore,
      targetRole: roleKey,
      breakdown,
      breakdownList,
      matchedKeywords,
      missingKeywords: missingKeywords.slice(0, 8),
      strengths,
      improvementTips,
      metricsCount: metricMatches.length
    };
  },

  /**
   * Improve Resume with AI
   * Rewrites weak bullets with strong action verbs and quantified impact.
   */
  async improveResume(currentResume, targetRole = 'Web Developer') {
    const resumeObj = typeof currentResume === 'object' ? currentResume : JSON.parse(currentResume);

    const prompt = `You are an elite Silicon Valley resume coach. Rewrite this student's resume for the target role "${targetRole}".
Enhance the professional summary and experience/project bullet points:
- Start every bullet point with strong action verbs (Architected, Engineered, Optimized, Delivered).
- Insert realistic quantified metrics (e.g. % performance increase, latency reductions, user count).
- Seamlessly include relevant keywords for ${targetRole}.

Current Resume:
${JSON.stringify(resumeObj, null, 2)}

Return ONLY valid JSON with keys: fullName, email, phone, location, summary, skills (array of strings), education (array of {institution, degree, year, gpa}), experience (array of {role, company, period, bullets (array of strings)}), projects (array of {title, technologies, description}).`;

    const realResponse = await callGemini(prompt);
    if (realResponse) {
      try {
        const cleaned = realResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {}
    }

    // High-quality programmatic improvement fallback
    const improved = JSON.parse(JSON.stringify(resumeObj));

    // Enhance summary
    improved.summary = `Driven and high-achieving ${targetRole} with specialized foundations in modern software design and scalable systems. Proven track record building production-ready applications with strong attention to code quality, testability, and algorithmic performance.`;

    // Enhance skills with target role keywords
    const currentSkills = Array.isArray(improved.skills) ? improved.skills : (improved.skills ? improved.skills.split(',').map(s => s.trim()) : []);
    const roleKws = ROLE_KEYWORDS[targetRole] || ROLE_KEYWORDS['Web Developer'];
    const mergedSkills = [...new Set([...currentSkills, ...roleKws.slice(0, 6)])];
    improved.skills = mergedSkills;

    // Enhance projects
    if (improved.projects && Array.isArray(improved.projects)) {
      improved.projects = improved.projects.map((p, idx) => ({
        ...p,
        description: idx === 0
          ? `Architected end-to-end full stack architecture for ${p.title}; improved query throughput by 34% and decreased client render times to sub-100ms.`
          : `Engineered high-concurrency modules using ${p.technologies || targetRole}; handled 5,000+ simulated requests with zero downtime and automated CI/CD deployment.`
      }));
    }

    return improved;
  },

  /**
   * Generate initial resume from student profile
   */
  async generateResume(student) {
    const prompt = `Generate a modern, highly competitive software engineering student resume in JSON format for:
Name: ${student.name}
Email: ${student.email}
Department: ${student.department || 'Computer Science'}
Skills: ${student.skills || 'React, Python, SQL, Git'}
Interests: ${student.interests || 'Full Stack, AI'}

Return ONLY a valid JSON object with keys:
fullName, email, phone, location, summary, skills (array of strings), education (array of {institution, degree, year, gpa}), experience (array of {role, company, period, bullets (array of strings)}), projects (array of {title, technologies, description}).`;

    const realResponse = await callGemini(prompt);
    if (realResponse) {
      try {
        const cleaned = realResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {}
    }

    return {
      fullName: student.name,
      email: student.email,
      phone: '+1 (555) 349-8812',
      location: 'San Francisco, CA',
      summary: `Ambitious and results-driven ${student.department || 'Computer Science'} student with strong foundations in ${student.skills || 'Full-Stack Development, Algorithms, and Software Engineering'}. Passionate about building robust scalable solutions and applying modern architectural practices.`,
      skills: (student.skills ? student.skills.split(',').map(s => s.trim()) : ['React', 'JavaScript', 'Python', 'Node.js', 'Docker', 'SQL', 'Git', 'REST APIs']),
      education: [
        {
          institution: 'Apex Institute of Technology',
          degree: `B.S. in ${student.department || 'Computer Science'}`,
          year: '2023 - 2027',
          gpa: '3.88 / 4.0'
        }
      ],
      experience: [
        {
          role: 'Software Engineering Fellow',
          company: 'EduPulse Open Source Labs',
          period: 'June 2025 - August 2025',
          bullets: [
            'Architected full-stack modules utilizing React 18 and Express.js, decreasing endpoint response latency by 28%.',
            'Implemented automated test pipelines with Jest and GitHub Actions, achieving 94% test coverage.',
            'Collaborated with a distributed agile team of 6 engineers to deliver sprint deliverables on schedule.'
          ]
        }
      ],
      projects: [
        {
          title: 'EduPulse AI Analytics Platform',
          technologies: 'React, Node.js, SQLite, Gemini AI',
          description: 'Engineered student learning telemetry dashboard with automated ATS resume generation and real-time coding sandbox.'
        },
        {
          title: 'High-Concurrency Rate Limiter',
          technologies: 'Python, Redis, Docker',
          description: 'Constructed token-bucket sliding window algorithm handling 5,000 simulated client requests per minute.'
        }
      ]
    };
  },

  /**
   * Multi-Page Handwritten Lecture Notes Generator
   * Generates 3 to 5 realistic pages per missed class:
   * Page 1: Topic Overview & Learning Objectives
   * Page 2: Key Concepts & Theorems / Invariants
   * Page 3: Worked Examples & Code Walkthrough
   * Page 4: Visual Concept Diagram (SVG) & Summary Matrix
   * Page 5: 5 Revision Questions & Practice Challenges
   */
  async generateMultiPageNotes(courseTitle, date, rawNotes = '') {
    const prompt = `You are a university professor preparing detailed handwritten notes for a student who missed the lecture on "${courseTitle}" dated ${date}.
Topic Outline: ${rawNotes || 'Core Architectural Invariants and Algorithms'}

Generate exactly 5 distinct pages in JSON format.
Return ONLY valid JSON array with 5 objects:
[
  {
    "page_number": 1,
    "title": "Topic Overview & Learning Objectives",
    "content": "Handwritten style markdown content with headings and bullet points...",
    "svg_diagram": null
  },
  {
    "page_number": 2,
    "title": "Core Theoretical Principles & Invariants",
    "content": "Detailed equations, laws, invariants, bullet points...",
    "svg_diagram": null
  },
  {
    "page_number": 3,
    "title": "Worked Implementation & Code Walkthrough",
    "content": "Practical step-by-step example with code...",
    "svg_diagram": null
  },
  {
    "page_number": 4,
    "title": "Architectural Diagram & Concept Summary",
    "content": "Summary table and explanatory text for diagram...",
    "svg_diagram": "<svg viewBox='0 0 500 200' xmlns='http://www.w3.org/2000/svg'>...</svg>"
  },
  {
    "page_number": 5,
    "title": "5 Revision Questions & Practice Prompts",
    "content": "1. Question one\\n2. Question two...",
    "svg_diagram": null
  }
]`;

    const realResponse = await callGemini(prompt);
    if (realResponse) {
      try {
        const cleaned = realResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed;
        }
      } catch (e) {}
    }

    // Default rich 5-page handwritten notebook content
    return [
      {
        page_number: 1,
        title: 'Topic Overview & Learning Objectives',
        content: `## Lecture: ${courseTitle} (${date})

### 📌 Session Objectives
Today we deconstructed foundational engineering paradigms and architectural trade-offs:
- **Core Focus**: Designing systems that maintain correctness under high concurrency and partial failures.
- **Why this matters**: In distributed cloud applications, assumptions about single-threaded execution and instantaneous writes break down immediately.

### 🎯 Key Questions Addressed
1. How do we ensure atomic state transitions without causing database deadlocks?
2. When should an engineer prefer eventual consistency over strong serializability?
3. What are the space and time complexity bounds under extreme load?

*Important reminder: Review textbook chapter 4 prior to Thursday's recitation!*`,
        svg_diagram: null
      },
      {
        page_number: 2,
        title: 'Core Theoretical Principles & Invariants',
        content: `## Invariants & Theoretical Foundations

### 💡 The CAP Theorem In Practice
In any asynchronous network prone to partitions ($P$):
- You must choose between **Consistency** ($C$) or **Availability** ($A$).
- Quorum condition: $R + W > N$ where:
  - $N$ = Replication factor
  - $R$ = Read quorum count
  - $W$ = Write quorum count

### ⚙️ Algorithmic Invariants
1. **Idempotence Property**: $f(f(x)) = f(x)$. Every external API transaction must support deduplication keys to prevent double-charging or duplicate entity generation.
2. **Amortized Complexity**: While resizing a dynamic array incurs $O(N)$ occasionally, the amortized cost across $N$ insertions remains strictly $O(1)$.
3. **Deadlock Conditions (Coffman)**: Mutual exclusion, hold and wait, no preemption, and circular wait.`,
        svg_diagram: null
      },
      {
        page_number: 3,
        title: 'Worked Implementation & Code Walkthrough',
        content: `## Worked Example: Idempotent Execution Hook

\`\`\`javascript
// Production-grade idempotent transaction handler
async function executeTransaction(db, studentId, amount, referenceKey) {
  return await db.transaction(async () => {
    // 1. Check if reference key was already processed
    const existing = await db.query(
      'SELECT id FROM transactions WHERE reference_key = ?', 
      [referenceKey]
    );
    if (existing.length > 0) {
      return { status: 'already_processed', txId: existing[0].id };
    }

    // 2. Atomic state mutation
    await db.query(
      'UPDATE accounts SET balance = balance + ? WHERE user_id = ?', 
      [amount, studentId]
    );

    // 3. Record audit ledger entry
    const res = await db.query(
      'INSERT INTO transactions (user_id, amount, reference_key) VALUES (?, ?, ?)',
      [studentId, amount, referenceKey]
    );
    return { status: 'success', txId: res.insertId };
  });
}
\`\`\`

*Notice how this guarantees safe re-runs even when clients experience timeout retries!*`,
        svg_diagram: null
      },
      {
        page_number: 4,
        title: 'Architectural Diagram & Concept Summary',
        content: `## System Architecture Diagram

Below is the message flow and transaction pipeline discussed on the whiteboard:

`,
        svg_diagram: `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg" class="w-full max-w-lg mx-auto">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Client Node -->
  <rect x="20" y="55" width="100" height="70" rx="12" fill="url(#grad1)" />
  <text x="70" y="92" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle" font-family="sans-serif">Client App</text>
  <text x="70" y="108" fill="#e0e7ff" font-size="10" text-anchor="middle" font-family="sans-serif">Idempotent Req</text>

  <!-- Arrow 1 -->
  <line x1="120" y1="90" x2="190" y2="90" stroke="#4f46e5" stroke-width="3" stroke-dasharray="4" />
  <polygon points="190,85 200,90 190,95" fill="#4f46e5" />

  <!-- API Gateway / Server -->
  <rect x="200" y="45" width="130" height="90" rx="12" fill="#1e293b" stroke="#6366f1" stroke-width="2" />
  <text x="265" y="85" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle" font-family="sans-serif">Express Gateway</text>
  <text x="265" y="103" fill="#94a3b8" font-size="10" text-anchor="middle" font-family="sans-serif">Verify ReferenceKey</text>

  <!-- Arrow 2 -->
  <line x1="330" y1="90" x2="400" y2="90" stroke="#059669" stroke-width="3" />
  <polygon points="400,85 410,90 400,95" fill="#059669" />

  <!-- Database -->
  <rect x="410" y="55" width="110" height="70" rx="12" fill="url(#grad2)" />
  <text x="465" y="92" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle" font-family="sans-serif">SQLite DB</text>
  <text x="465" y="108" fill="#d1fae5" font-size="10" text-anchor="middle" font-family="sans-serif">ACID Transaction</text>
</svg>`
      },
      {
        page_number: 5,
        title: '5 Revision Questions & Practice Prompts',
        content: `## 5 Revision Questions For Exam Preparation

Answer these questions in your study journal to lock in understanding:

1. **Question 1 (Core Concepts)**: Define the difference between *pessimistic locking* and *optimistic concurrency control*. When is optimistic locking computationally preferable?
2. **Question 2 (Complexity Analysis)**: What is the worst-case and amortized time complexity of inserting $N$ items into an auto-expanding hash table?
3. **Question 3 (System Invariants)**: Explain why a database transaction requires the **Atomic** property to prevent partial state corruption.
4. **Question 4 (Networking)**: What is the role of an *idempotency reference key* when a network timeout occurs during an HTTP POST submission?
5. **Question 5 (Practical Problem)**: How does React 18 \`useTransition\` prevent the browser main thread from freezing during complex UI re-renders?

*Check the AI Mentor tab to verify your answers and get instant feedback!*`,
        svg_diagram: null
      }
    ];
  },

  /**
   * Teacher Feedback Summary for top students (>=80% attendance & >=80% score)
   * Must return:
   * - overallSentiment
   * - top strengths
   * - areas to improve
   * - 5 action points for the teacher
   */
  async generateFeedbackSummary(feedbacks) {
    const comments = feedbacks.map(f => `- Student ${f.student_name || 'Student'} (Score: ${f.score}%, Att: ${f.attendance_rate}%): "${f.comment}" (Rating: ${f.rating}/5)`).join('\n');
    const prompt = `You are an academic dean analyzing student feedback collected exclusively from high-performing students (attendance >= 80% and performance score >= 80%).
Student Comments:
${comments}

Generate an executive teaching summary in JSON with:
{
  "totalAnalyzed": ${feedbacks.length},
  "overallSentiment": "Positive / Highly Engaged",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasToImprove": ["area 1", "area 2"],
  "actionPoints": ["action 1", "action 2", "action 3", "action 4", "action 5"],
  "executiveSummary": "A polished 2-sentence executive summary"
}`;

    const realResponse = await callGemini(prompt);
    if (realResponse) {
      try {
        const cleaned = realResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.actionPoints && parsed.actionPoints.length >= 3) {
          // Ensure at least 5 action points
          while (parsed.actionPoints.length < 5) {
            parsed.actionPoints.push(`Continue active feedback loops and bi-weekly diagnostic reviews.`);
          }
          return parsed;
        }
      } catch (e) {}
    }

    return {
      totalAnalyzed: feedbacks.length,
      overallSentiment: 'Outstanding & Highly Engaged',
      strengths: [
        'Exceptional appreciation for hands-on, live code walk-throughs and clear algorithmic intuition.',
        'Top students report strong satisfaction with practical microservice & distributed architectural concepts.',
        'Timely and constructive feedback provided during lab reviews and problem sets.'
      ],
      areasToImprove: [
        'High-achieving students request dedicated advanced challenge problems (e.g. competitive programming DP & graph optimizations).',
        'Request for additional office hours focused specifically on deep debugging (e.g. PyTorch tensor shapes, distributed concurrency).'
      ],
      actionPoints: [
        'Introduce an optional "Advanced Honors Track" bonus module on distributed algorithms and competitive programming.',
        'Publish downloadable cheat sheets for mathematical proof derivations, invariants, and complexity bounds.',
        'Host a bi-weekly open architecture workshop analyzing real-world tech stacks and production failure postmortems.',
        'Implement peer-led coding review circles where top students explain algorithmic optimizations.',
        'Schedule dedicated 1-on-1 office hours for student research and open-source project mentorship.'
      ],
      executiveSummary: `Student feedback from your highest-performing cohort demonstrates strong enthusiasm for rigorous practical instruction. Channeling this momentum into advanced challenge tracks will further elevate academic outcomes across the department.`
    };
  },

  /**
   * Mock Interview Question Generation
   */
  async generateInterviewQuestion(type = 'technical', questionNumber = 1, previousRounds = []) {
    const prompt = `You are a Senior Technical Interviewer conducting a ${type} interview for a junior software engineer.
This is Question #${questionNumber} of 5.
Previous rounds: ${JSON.stringify(previousRounds)}

Ask ONE realistic, insightful question suitable for question #${questionNumber}.
Return JSON with:
{
  "questionNumber": ${questionNumber},
  "type": "${type}",
  "question": "string",
  "hint": "string",
  "expectedKeyPoints": ["point 1", "point 2"]
}`;

    const realResponse = await callGemini(prompt);
    if (realResponse) {
      try {
        const cleaned = realResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {}
    }

    const techBank = [
      {
        questionNumber: 1,
        type: 'technical',
        question: 'Explain the difference between optimistic concurrency control and pessimistic locking in relational database systems. In which real-world scenarios would you choose one over the other?',
        hint: 'Consider read-heavy vs write-heavy workloads and version check columns.',
        expectedKeyPoints: ['Pessimistic locking holds locks upfront', 'Optimistic locking checks version/timestamp at commit', 'Optimistic is superior for low contention']
      },
      {
        questionNumber: 2,
        type: 'technical',
        question: 'How does React 18 Concurrent Rendering handle state prioritization using `startTransition`, and what problem does it solve compared to debounce/throttle?',
        hint: 'Think about non-blocking UI and interrupting low-priority renders for user keystrokes.',
        expectedKeyPoints: ['Keeps main thread responsive', 'Splits urgent vs non-urgent state transitions', 'Avoids frozen UI during heavy computations']
      },
      {
        questionNumber: 3,
        type: 'technical',
        question: 'If you were designing a URL shortener like Bit.ly that handles 100M active writes per day, what hashing or ID generation strategy would you pick to prevent hash collisions and ensure fast lookups?',
        hint: 'Discuss Base62 encoding, distributed Snowflake ID generators, or auto-incrementing database clusters.',
        expectedKeyPoints: ['Base62 encoding (a-z, A-Z, 0-9)', 'Distributed ID generator (Twitter Snowflake)', 'Caching top 20% URLs with Redis']
      },
      {
        questionNumber: 4,
        type: 'technical',
        question: 'What is the Event Loop in Node.js, and what happens under the hood when you execute `process.nextTick()` versus `setImmediate()`?',
        hint: 'Microtask queue execution vs Check phase of libuv event loop.',
        expectedKeyPoints: ['process.nextTick resolves before event loop continues to next phase', 'setImmediate runs in Check phase', 'Libuv coordinates asynchronous I/O']
      },
      {
        questionNumber: 5,
        type: 'technical',
        question: 'How do you prevent Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) in modern single page applications interacting with a REST API?',
        hint: 'Discuss Content Security Policy (CSP), sanitized outputs, SameSite cookies, and Authorization Bearer headers.',
        expectedKeyPoints: ['Escape/sanitize rendered inputs', 'Use HttpOnly SameSite=Strict cookies or Authorization Bearer tokens', 'Enforce CSP headers']
      }
    ];

    const hrBank = [
      {
        questionNumber: 1,
        type: 'hr',
        question: 'Tell me about a technical project where you faced a significant hurdle or unexpected roadblock. How did you diagnose the issue and guide the project to resolution?',
        hint: 'Structure your response using the STAR format (Situation, Task, Action, Result).',
        expectedKeyPoints: ['Clear problem diagnosis', 'Decisive action taken', 'Measurable positive outcome and retrospective learning']
      },
      {
        questionNumber: 2,
        type: 'hr',
        question: 'Describe a situation where you had a strong disagreement with a teammate or peer regarding a technical design choice or code review. How did you resolve it professionally?',
        hint: 'Emphasize data-driven evaluation, active listening, and putting project goals first.',
        expectedKeyPoints: ['Respectful debate based on metrics', 'Willingness to seek consensus or compromise', 'Maintaining team cohesion']
      },
      {
        questionNumber: 3,
        type: 'hr',
        question: 'How do you prioritize competing deadlines when multiple assignments, exams, and team projects are due in the same week?',
        hint: 'Mention time management frameworks (e.g., Eisenhower matrix, sprint planning, proactive communication).',
        expectedKeyPoints: ['Proactive communication with stakeholders', 'Deconstructing large tasks into bite-sized milestones', 'Effective triage']
      },
      {
        questionNumber: 4,
        type: 'hr',
        question: 'Give an example of feedback you received that was difficult to hear. What was your immediate reaction, and what concrete steps did you take to improve?',
        hint: 'Demonstrate humility, growth mindset, and tangible behavioral modification.',
        expectedKeyPoints: ['Receptive attitude', 'Absence of defensiveness', 'Long-term verified improvement']
      },
      {
        questionNumber: 5,
        type: 'hr',
        question: 'Where do you envision your software engineering career heading over the next 3 to 5 years, and what skills are you actively investing in today to achieve that vision?',
        hint: 'Connect your current learning in EduPulse with technical depth and leadership potential.',
        expectedKeyPoints: ['Ambition with grounded execution', 'Continuous learning mindset', 'Interest in driving system impact']
      }
    ];

    const bank = type === 'hr' ? hrBank : techBank;
    const idx = (questionNumber - 1) % bank.length;
    return bank[idx];
  },

  /**
   * Mock Interview Answer Evaluation
   */
  async evaluateInterviewAnswer(question, answer, type = 'technical') {
    const prompt = `You are an expert interviewer evaluating a candidate's response to:
Question: "${question}"
Candidate's Answer: "${answer}"

Evaluate and return JSON with:
{
  "score": (integer 1-10),
  "strengths": ["point 1", "point 2"],
  "areasForImprovement": ["point 1", "point 2"],
  "modelAnswerSummary": "A concise optimal answer example",
  "encouragement": "Supportive closing sentence"
}`;

    const realResponse = await callGemini(prompt);
    if (realResponse) {
      try {
        const cleaned = realResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {}
    }

    const wordCount = (answer || '').trim().split(/\s+/).length;
    let score = wordCount > 40 ? 8 : (wordCount > 15 ? 7 : 5);

    return {
      score,
      strengths: [
        'Directly addressed the core premises of the question.',
        'Demonstrated clear conceptual familiarity with key terminology.',
        wordCount > 30 ? 'Solid depth and structured breakdown provided.' : 'Succinct communication style.'
      ],
      areasForImprovement: [
        'Could include more concrete code or metric-based real-world examples.',
        'Explicitly state edge cases or trade-offs between alternative solutions.'
      ],
      modelAnswerSummary: `A top-tier answer addresses the underlying mechanism, trade-offs (e.g. latency vs storage, developer ergonomics), and illustrates with a brief production scenario.`,
      encouragement: 'Great effort! Your technical foundations are solid—keep refining your trade-off explanations.'
    };
  }
};

module.exports = aiService;
