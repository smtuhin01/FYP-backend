const Admin = require('../models/Admin');
const User = require('../models/User');
const Lecturer = require('../models/Lecturer');
const Media = require('../models/Media');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Admin login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fixed admin credentials for simplicity
    if (username === 'Admin' && password === 'admin911') {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
        expiresIn: '1d'
      });
      return res.status(200).json({ token });
    }
    
    // If you want to use database authentication:
    // const admin = await Admin.findOne({ username });
    // if (!admin || !(await admin.matchPassword(password))) {
    //   return res.status(401).json({ message: 'Invalid credentials' });
    // }
    // const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
    //   expiresIn: '1d'
    // });
    // res.status(200).json({ token });
    
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find().select('-password');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all lecturers
exports.getAllLecturers = async (req, res) => {
  try {
    const lecturers = await Lecturer.find().select('-password');
    res.status(200).json(lecturers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a student
exports.createStudent = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const student = await User.create({
      name,
      email,
      password
    });

    res.status(201).json({
      _id: student._id,
      name: student.name,
      email: student.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a lecturer
exports.createLecturer = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const lecturerExists = await Lecturer.findOne({ email });
    if (lecturerExists) {
      return res.status(400).json({ message: 'Lecturer already exists' });
    }

    const lecturer = await Lecturer.create({
      name,
      email,
      password
    });

    res.status(201).json({
      _id: lecturer._id,
      name: lecturer.name,
      email: lecturer.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a student
exports.updateStudent = async (req, res) => {
  const { name, email } = req.body;

  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.name = name || student.name;
    student.email = email || student.email;
    
    const updatedStudent = await student.save();
    
    res.status(200).json({
      _id: updatedStudent._id,
      name: updatedStudent.name,
      email: updatedStudent.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a lecturer
exports.updateLecturer = async (req, res) => {
  const { name, email } = req.body;

  try {
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    lecturer.name = name || lecturer.name;
    lecturer.email = email || lecturer.email;
    
    const updatedLecturer = await lecturer.save();
    
    res.status(200).json({
      _id: updatedLecturer._id,
      name: updatedLecturer.name,
      email: updatedLecturer.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await student.deleteOne();
    res.status(200).json({ message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a lecturer
exports.deleteLecturer = async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    await lecturer.deleteOne();
    res.status(200).json({ message: 'Lecturer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload media
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { name, category, mediaType } = req.body;
    const parameters = req.body.parameters ? JSON.parse(req.body.parameters) : {};

    // Ensure category and mediaType are present
    if (!category || !mediaType) {
      return res.status(400).json({ message: "Category and mediaType are required." });
    }

    // Determine storagePath
    let storagePath;
    if (mediaType === 'video') {
      storagePath = 'Video';
    } else if (category) {
      storagePath = category.toLowerCase();
    } else {
      storagePath = 'misc';
    }

    // Move the file to the appropriate folder
    const sourceFilePath = `./temp-uploads/${req.file.filename}`;
    const targetDir = `./frontend/${storagePath}`;
    
    // Ensure the target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const targetFilePath = `${targetDir}/${req.file.filename}`;
    
    // Create thumbnail if it's an image
    let thumbnailFile = null;
    if (mediaType === 'image') {
      // Create a thumbnail version for the image
      const thumbName = req.file.filename.replace('.jpg', '_thumb.jpg').replace('.png', '_thumb.png');
      // [Thumbnail creation code...]
      thumbnailFile = thumbName;
    }

    // Save media information to database
    const media = new Media({
      name,
      filename: req.file.filename,
      thumbnailFilename: thumbnailFile,
      category,
      mediaType,
      parameters,
      storagePath // <-- this must always be set
    });

    try {
      await media.save();
      res.status(201).json({ message: "Media uploaded successfully", media });
    } catch (err) {
      console.error("Error saving media:", err);
      res.status(500).json({ message: "Failed to save media", error: err.message });
    }
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ message: 'Server error during media upload' });
  }
};

// Get all media
exports.getAllMedia = async (req, res) => {
  try {
    const { category, mediaType } = req.query;
    
    // Build filter based on query parameters
    const filter = {};
    if (category) filter.category = category;
    if (mediaType) filter.mediaType = mediaType;
    
    const media = await Media.find(filter);
    res.status(200).json(media);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get media by category
exports.getMediaByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const media = await Media.find({ category });
    res.status(200).json(media);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete media
exports.deleteMedia = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db);
    
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Delete file from GridFS
    if (media.fileId) {
      await bucket.delete(media.fileId);
    }

    // Delete media record
    await media.deleteOne();
    res.status(200).json({ message: 'Media removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};