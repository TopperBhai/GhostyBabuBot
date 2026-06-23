const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  id: { type: String, default: 'GLOBAL' },
  treasury: { type: Number, default: 10000000 },
  taxRate: { type: Number, default: 0.10 }, // 10%
  presidentId: { type: String, default: 'None' }
});

module.exports = mongoose.model('State', stateSchema);
