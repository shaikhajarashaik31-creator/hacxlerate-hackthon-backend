const db = require('../db/database');

function activityLogger(req, res, next) {
  // Pass through without blocking
  next();
}

module.exports = activityLogger;
