const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyAdmin } = require('../middleware/adminMiddleware');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const jwt = require('jsonwebtoken');
const Lecturer = require('../models/Lecturer');

// Admin auth routes
router.post('/login', adminController.login);

// Lecturer login route
router.post('/lecturer-login', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { lecturerId } = req.body;
    
    // Verify lecturer exists
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    // Generate temporary token
    const token = jwt.sign(
      { id: lecturer._id, role: 'lecturer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error generating lecturer access' });
  }
});

// Lecturer portal access route
router.post('/lecturer-portal-access', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { lecturerId, email } = req.body;
    
    // Verify lecturer exists
    const lecturer = await Lecturer.findOne({ 
      _id: lecturerId,
      email: email 
    });

    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    // Generate temporary access token
    const token = jwt.sign(
      { 
        id: lecturer._id, 
        role: 'lecturer',
        email: lecturer.email,
        name: lecturer.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      message: 'Portal access granted successfully' 
    });

  } catch (error) {
    console.error('Lecturer portal access error:', error);
    res.status(500).json({ 
      message: 'Failed to generate portal access',
      error: error.message 
    });
  }
});

// Protected admin routes
router.get('/students', verifyToken, verifyAdmin, adminController.getAllStudents);
router.post('/students', verifyToken, verifyAdmin, adminController.createStudent);
router.put('/students/:id', verifyToken, verifyAdmin, adminController.updateStudent);
router.delete('/students/:id', verifyToken, verifyAdmin, adminController.deleteStudent);

router.get('/lecturers', verifyToken, verifyAdmin, adminController.getAllLecturers);
router.post('/lecturers', verifyToken, verifyAdmin, adminController.createLecturer);
router.put('/lecturers/:id', verifyToken, verifyAdmin, adminController.updateLecturer);
router.delete('/lecturers/:id', verifyToken, verifyAdmin, adminController.deleteLecturer);

// Media routes
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => ({
    filename: Date.now() + '-' + file.originalname,
    bucketName: 'uploads'
  })
});
const upload = multer({ storage });

router.post('/media', 
  verifyToken, 
  verifyAdmin, 
  upload.single('file'), 
  adminController.uploadMedia
);
router.get('/media', verifyToken, verifyAdmin, adminController.getAllMedia);
router.get('/media/:category', verifyToken, verifyAdmin, adminController.getMediaByCategory);
router.delete('/media/:id', verifyToken, verifyAdmin, adminController.deleteMedia);

module.exports = router;