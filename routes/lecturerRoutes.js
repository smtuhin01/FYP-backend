const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getAllStudents,
  commentOnStudent,
  getNotifications,
  resetPassword // Import the resetPassword function
} = require('../controllers/LecturerController');

const { verifyLecturer, verifyToken } = require('../middleware/authMiddleware');

// Lecturer Auth
router.post('/register', register);
router.post('/login', login);

// Lecturer-only routes
router.get('/students', verifyToken, verifyLecturer, getAllStudents);
router.post('/comment', verifyToken, verifyLecturer, commentOnStudent);

// Student-specific route (view notifications sent by lecturers)
router.get('/student/notifications', verifyToken, getNotifications);

// Make sure this route is before any middleware
router.post('/reset-password', resetPassword);

module.exports = router;
console.log('Register:', typeof register);
console.log('Login:', typeof login);
console.log('Get All:', typeof getAllStudents);
console.log('Comment:', typeof commentOnStudent);
console.log('Notifications:', typeof getNotifications);
console.log('Reset Password:', typeof resetPassword);
