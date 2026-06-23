
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 0 },
  nation: { type: String, default: 'None' },
  role: { type: String, default: 'Citizen' },
  inventory: { type: Array, default: [] }
});
module.exports = mongoose.model('User', userSchema);
