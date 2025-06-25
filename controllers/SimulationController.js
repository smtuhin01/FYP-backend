const ImageParameter = require('../models/ImageParameter');

// Save or update parameters for an image
exports.saveImageParameter = async (req, res) => {
const { userId, imageId, imageName, parameters, overlay } = req.body;
  try {
    // Check if entry already exists for this user and image
    let record = await ImageParameter.findOne({ userId, imageId });

    if (record) {
      // Update existing record
      record.parameters = parameters;
      record.overlay = overlay;
      await record.save();
    } else {
      // Create new record
      record = await ImageParameter.create({
        userId,
        imageId,
        imageName,
        parameters,
        overlay
      });
    }

    res.status(200).json({ message: 'Parameters saved successfully', data: record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save parameters', details: err.message });
  }
};

// Get all parameters saved by a student
exports.getUserImageParameters = async (req, res) => {
  const { userId } = req.params;

  try {
    const records = await ImageParameter.find({ userId });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch parameters', details: err.message });
  }
};

const validateOverlay = (overlay) => {
  if (!overlay) return true; // Optional field
  
  const required = ['left', 'top', 'width', 'height'];
  const missing = required.filter(field => overlay[field] === undefined);
  
  if (missing.length > 0) {
    throw new Error(`Missing overlay fields: ${missing.join(', ')}`);
  }
  
  return true;
};
