
const mongoose = require('mongoose');
const nationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  population: { type: Number, default: 0 },
  treasury: { type: Number, default: 0 },
  gdp: { type: Number, default: 0 },
  happiness: { type: Number, default: 100 },
  powerScore: { type: Number, default: 100 },
  leaderId: { type: String, default: null }
});
module.exports = mongoose.model('Nation', nationSchema);
