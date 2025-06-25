const mongoose = require('mongoose');
const bcrypt = require('bcrypts');

const lecturerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

lecturerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

lecturerSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Lecturer', lecturerSchema);
