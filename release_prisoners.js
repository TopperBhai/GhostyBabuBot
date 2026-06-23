require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function releasePrisoners() {
  try {
    console.log("🔄 Connecting to GhostVerse Database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected.");

    console.log("🔓 Releasing all prisoners...");
    const result = await User.updateMany(
      { jailUntil: { $ne: null } },
      { $set: { jailUntil: null } }
    );

    console.log(`🎉 Successfully released ${result.modifiedCount} prisoners!`);
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

releasePrisoners();
