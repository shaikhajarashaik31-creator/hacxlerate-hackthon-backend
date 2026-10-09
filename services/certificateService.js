const db = require('../db/database');
const coinService = require('./coinService');

const certificateService = {
  issueCertificate: (studentId, courseId) => {
    // Check if certificate already exists
    const existing = db.prepare(`
      SELECT c.*, cr.title AS course_title, u.name AS student_name
      FROM certificates c
      JOIN courses cr ON c.course_id = cr.id
      JOIN users u ON c.student_id = u.id
      WHERE c.student_id = ? AND c.course_id = ?
    `).get(studentId, courseId);

    if (existing) {
      return existing;
    }

    const course = db.prepare(`SELECT * FROM courses WHERE id = ?`).get(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const year = new Date().getFullYear();
    const courseCode = course.title.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certCode = `EDU-${year}-${courseCode}-${randomHex}`;

    db.prepare(`
      INSERT INTO certificates (student_id, course_id, certificate_code, issued_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(studentId, courseId, certCode);

    // Award bonus coins for completing extra course
    if (course.is_extra) {
      coinService.awardCoins(studentId, 100, `Completed advanced course: ${course.title}`, `cert_course_${studentId}_${courseId}`);
    }

    return db.prepare(`
      SELECT c.*, cr.title AS course_title, cr.description AS course_description, u.name AS student_name
      FROM certificates c
      JOIN courses cr ON c.course_id = cr.id
      JOIN users u ON c.student_id = u.id
      WHERE c.certificate_code = ?
    `).get(certCode);
  },

  getCertificatesForStudent: (studentId) => {
    return db.prepare(`
      SELECT c.*, cr.title AS course_title, cr.description AS course_description,
             t.name AS teacher_name, u.name AS student_name
      FROM certificates c
      JOIN courses cr ON c.course_id = cr.id
      LEFT JOIN users t ON cr.teacher_id = t.id
      JOIN users u ON c.student_id = u.id
      WHERE c.student_id = ?
      ORDER BY c.issued_at DESC
    `).all(studentId);
  },

  getCertificateByCode: (code) => {
    return db.prepare(`
      SELECT c.*, cr.title AS course_title, cr.description AS course_description,
             t.name AS teacher_name, u.name AS student_name
      FROM certificates c
      JOIN courses cr ON c.course_id = cr.id
      LEFT JOIN users t ON cr.teacher_id = t.id
      JOIN users u ON c.student_id = u.id
      WHERE c.certificate_code = ?
    `).get(code);
  }
};

module.exports = certificateService;
