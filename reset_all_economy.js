require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Business = require('./src/models/Business');
const Property = require('./src/models/Property');
const Market = require('./src/models/Market');
const Stock = require('./src/models/Stock');
const State = require('./src/models/State');
const Nation = require('./src/models/Nation');

async function totalReset() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB. Starting total economy wipe...");

  // 1. Reset all users
  const res = await User.updateMany({}, {
    $set: {
      wallet: 500,
      bank: 0,
      jobTitle: 'Unemployed',
      jobSalary: 0,
      employerId: 'None',
      portfolio: {}
    }
  });
  console.log(`Reset ${res.modifiedCount} user accounts.`);

  // 2. Delete businesses & properties
  await Business.deleteMany({});
  await Property.deleteMany({});
  console.log("Deleted all player businesses and real estate properties.");

  // 3. Seed realistic global market commodities
  await Market.deleteMany({});
  const commodities = [
    { commodity: 'Food', price: 5, supply: 1000, demand: 2000 },
    { commodity: 'Ore', price: 12, supply: 1000, demand: 2000 },
    { commodity: 'Meals', price: 18, supply: 500, demand: 1000 },
    { commodity: 'Goods', price: 35, supply: 500, demand: 1000 }
  ];
  await Market.insertMany(commodities);
  console.log("Seeded realistic global market prices.");

  // 4. Seed realistic parody stock market
  await Stock.deleteMany({});
  const stocks = [
    { name: 'Microhard', price: 120, volatility: 2 },
    { name: 'Tasla', price: 85, volatility: 5 },
    { name: 'Space Y', price: 65, volatility: 4 },
    { name: 'Boogle', price: 95, volatility: 2 },
    { name: 'Beta', price: 50, volatility: 3 },
    { name: 'HitCoin', price: 30, volatility: 8 },
    { name: 'Pintel', price: 40, volatility: 3 },
    { name: 'WhiteRock', price: 110, volatility: 1 },
    { name: 'AmmaZone', price: 100, volatility: 2 }
  ];
  await Stock.insertMany(stocks);
  console.log("Seeded realistic parody stock market.");

  // 5. Reset treasuries
  await State.updateOne({ id: 'GLOBAL' }, { $set: { treasury: 10000, taxRate: 0.10 } }, { upsert: true });
  await Nation.updateMany({}, { $set: { treasury: 5000 } });
  console.log("Reset State and Nation treasuries.");

  console.log("🎉 TOTAL ECONOMY RESET COMPLETE!");
  process.exit(0);
}

totalReset();
