const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  commodity: { type: String, required: true, unique: true },
  price: { type: Number, default: 100 },
  supply: { type: Number, default: 10000 },
  demand: { type: Number, default: 10000 }
});

module.exports = mongoose.model('Market', marketSchema);
