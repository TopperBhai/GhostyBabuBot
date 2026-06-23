const mongoose = require('mongoose');
const businessSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  type: { type: String, required: true }, // Mine, Factory, Bank, Casino
  customName: { type: String, default: null },
  level: { type: Number, default: 1 },
  inventory: { type: Object, default: {} },
  lastCollected: { type: Number, default: Date.now }
});
module.exports = mongoose.model('Business', businessSchema);
