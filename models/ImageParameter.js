const mongoose = require('mongoose');

const imageParameterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageId: {
    type: String,
    required: true
  },
  imageName: {
    type: String,
    required: true
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
  overlay: {
    left: Number,
    top: Number,

    width: Number,
    height: Number,
    angle: Number
  }

}, { timestamps: true });

module.exports = mongoose.model('ImageParameter', imageParameterSchema);
