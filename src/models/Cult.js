
const mongoose = require('mongoose');
const cultSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  founderId: { type: String, required: true },
  perk: { type: String, required: true }, // Thieves Guild, Capitalists, Warmongers
  followers: { type: Number, default: 1 }
});
module.exports = mongoose.model('Cult', cultSchema);
