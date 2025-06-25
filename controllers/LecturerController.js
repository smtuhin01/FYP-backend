const Lecturer = require('../models/Lecturer');
const Notification = require('../models/Notification');
const ImageParameter = require('../models/ImageParameter');
const jwt = require('jsonwebtoken');


const register = async (req, res) => {
  const { name, email, password } = req.body;
  console.log('📩 Received from client:', req.body);

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields (name, email, password) are required' });
  }

  try {
    const existing = await Lecturer.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // ✅ Let the schema's pre-save hook handle password hashing
    const lecturer = await Lecturer.create({ name, email, password });

    res.status(201).json({ message: 'Lecturer registered successfully', lecturer });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// Lecturer Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const lecturer = await Lecturer.findOne({ email });
    if (!lecturer || !(await lecturer.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: lecturer._id, role: 'lecturer' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Get all students' submissions (for lecturers)
const getAllStudents = async (req, res) => {
  try {
    const data = await ImageParameter.find().populate('userId');
    const grouped = {};

    data.forEach(record => {
      if (!record.userId) return; // ✅ Skip broken/missing records

      const key = record.userId._id;
      if (!grouped[key]) {
        grouped[key] = { student: record.userId, images: [] };
      }
      grouped[key].images.push(record);
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('❌ Fetch students error:', err.message);
    res.status(500).json({ message: 'Failed to fetch students', error: err.message });
  }
};


// Lecturer commenting on a student
const commentOnStudent = async (req, res) => {
  const { studentId, imageId, comment, mark } = req.body;

  try {
    await Notification.create({
      studentId,
      lecturerId: req.user.id,
      imageId,
      comment,
      mark
    });

    res.json({ message: 'Comment and mark sent successfully' });
  } catch (err) {
    console.error('❌ Comment error:', err.message);
    res.status(500).json({ message: 'Failed to send comment', error: err.message });
  }
};

// Student viewing comments/notifications
const getNotifications = async (req, res) => {
  try {
    const notes = await Notification.find({ studentId: req.user.id }).populate('lecturerId');

    // Optionally mark as read
    await Notification.updateMany({ studentId: req.user.id, isRead: false }, { isRead: true });

    res.json(notes);
  } catch (err) {
    console.error('❌ Get notifications error:', err.message);
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  
  try {
    const lecturer = await Lecturer.findOne({ email });
    
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found with this email' });
    }
    
    // Update password
    lecturer.password = newPassword;
    await lecturer.save(); 
    
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error resetting password', error: err.message });
  }
};

// Add to exports
module.exports = {
  register,
  login, 
  getAllStudents,
  commentOnStudent,
  getNotifications,
  resetPassword  // Add this
};
