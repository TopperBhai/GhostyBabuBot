require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('./src/models/Stock');
const User = require('./src/models/User');

const NEW_STOCKS = [
  { name: 'Microhard', price: 150, volatility: 2 },
  { name: 'Tasla', price: 200, volatility: 8 },
  { name: 'Space Y', price: 300, volatility: 12 },
  { name: 'Boogle', price: 250, volatility: 3 },
  { name: 'Beta', price: 120, volatility: 6 },
  { name: 'HitCoin', price: 500, volatility: 25 },
  { name: 'Pintel', price: 80, volatility: 4 },
  { name: 'WhiteRock', price: 1000, volatility: 1 },
  { name: 'AmmaZone', price: 220, volatility: 3 }
];

async function seedStocks() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to GhostVerse Database.");

  // 1. Wipe Old Stocks
  await Stock.deleteMany({});
  console.log("Deleted all old stocks.");

  // 2. Insert New Stocks
  for (const s of NEW_STOCKS) {
    await new Stock({
      name: s.name,
      price: s.price,
      previousPrice: s.price,
      volatility: s.volatility
    }).save();
    console.log(`Created Stock: ${s.name}`);
  }

  // 3. Wipe User Portfolios
  await User.updateMany({}, { $set: { portfolio: {} } });
  console.log("Wiped all player portfolios.");

  console.log("Phase 6 Setup Complete!");
  process.exit();
}

seedStocks();
