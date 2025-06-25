const jwt = require('jsonwebtoken');

// Middleware to verify any logged-in user (Student or Lecturer)
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

// Middleware to ensure only lecturers access certain routes
const verifyLecturer = (req, res, next) => {
  if (!req.user || req.user.role !== 'lecturer') {
    return res.status(403).json({ message: 'Access Denied: Lecturers only' });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyLecturer
};
