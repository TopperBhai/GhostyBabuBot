require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('./src/models/Stock');

async function removeOld() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const oldNames = ['ShadowCorp', 'FrostTech', 'CrimsonArms', 'NeonMedia', 'LostAirlines'];
  const res = await Stock.deleteMany({ name: { $in: oldNames } });
  console.log(`Deleted ${res.deletedCount} old stocks.`);

  process.exit();
}

removeOld();
