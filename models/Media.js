const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    required: true,
    enum: ['Brain', 'Spine', 'Abdominal']
  },
  mediaType: {
    type: String,
    required: true,
    enum: ['image', 'video']
  },
  filename: {
    type: String,
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files'
  },
  thumbnailFilename: {
    type: String
  },
  parameters: {
    geometry: {
      fov: Number,
      matrixSize: String,
      sliceThickness: Number,
      sliceGap: Number,
      planeOrientation: String,
      foldoverDirection: String
    },
    sequence: {
      tr: Number,
      te: Number,
      flipAngle: Number,
      pulseSequence: String
    }
  },
  storagePath: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);