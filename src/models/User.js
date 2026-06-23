const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  nation: { type: String, default: 'None' },
  role: { type: String, default: 'Citizen' },
  inventory: { type: Array, default: [] }, // Custom artifacts go here too
  portfolio: { type: Object, default: {} },
  jailUntil: { type: Date, default: null },
  cult: { type: String, default: 'None' },
  jobTitle: { type: String, default: 'Unemployed' },
  jobSalary: { type: Number, default: 0 },
  employerId: { type: String, default: 'None' },
  votedFor: { type: String, default: 'None' },
  votesReceived: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
