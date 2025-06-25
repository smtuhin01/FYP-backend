
const express = require('express');
const router = express.Router();
const ImageParam = require('../models/ImageParameter');

router.post('/save', async (req, res) => {
  console.log("Incoming data:", req.body); 
  const { userId, imageId, imageName, parameters,overlay } = req.body;

  try {
   const existing = await ImageParam.findOne({ userId, imageId });
    if (existing) {
      existing.parameters = parameters;
      existing.overlay = overlay;
      existing.markModified('overlay');
      await existing.save();
      res.status(200).json({ message: 'Parameters updated successfully.' });
    } else {
     await ImageParam.create({ userId, imageId, imageName, parameters,overlay });
      res.status(201).json({ message: 'Parameters saved successfully.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save parameters.' });
  }
});

// Get all saved parameters for a student
router.get('/student/:userId', async (req, res) => {
  try {
    const data = await ImageParam.find({ userId: req.params.userId });
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch parameters.' });
  }
});

module.exports = router;
