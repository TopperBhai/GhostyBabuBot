
const mongoose = require('mongoose');
const stockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // ShadowCorp, FrostTech, etc.
  price: { type: Number, default: 100 },
  previousPrice: { type: Number, default: 100 },
  trend: { type: String, default: 'STABLE' }, // BULL, BEAR, STABLE
  volatility: { type: Number, default: 5 } // Max price change % per tick
});
module.exports = mongoose.model('Stock', stockSchema);
