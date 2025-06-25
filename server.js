const express = require('express');
require('dotenv').config();
const path = require('path');
const cors = require('cors');
const multer = require('multer'); // Add this import
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const parameterRoutes = require('./routes/parameterRoutes');
const lecturerRoutes = require('./routes/lecturerRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Import adminRoutes
const assistantRoutes = require('./routes/assistantRoutes'); // Import assistantRoutes
const fs = require('fs'); // Add this import
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve all static files from ../frontend (correct path from backend/server.js)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ✅ (Optional) Alias /lecturer-login.html to the subfolder
app.get('/lecturer-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'lecturer', 'lecturer-login.html'));
});

// Ensure needed directories exist
const ensureDirectoriesExist = () => {
  const directories = [
    './frontend/Video',
    './frontend/brain',
    './frontend/spine',
    './frontend/abdominal',
    './frontend/cardic',
    './temp-uploads'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectoriesExist();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/admin', adminRoutes); // Use adminRoutes
app.use('/api/assistant', assistantRoutes); // Use assistantRoutes
//  Default route to home.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File is too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      message: 'File upload error'
    });
  }
  
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
