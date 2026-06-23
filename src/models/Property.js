const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  type: { type: String, required: true },
  value: { type: Number, required: true },
  baseRent: { type: Number, required: true },
  lastCollected: { type: Number, default: Date.now }
});

module.exports = mongoose.model('Property', propertySchema);
