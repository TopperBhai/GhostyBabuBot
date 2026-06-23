const cron = require('node-cron');
const User = require('../models/User');

module.exports = (client) => {
  // Global Tick Engine: Runs at the start of every hour
  cron.schedule('0 * * * *', async () => {
    console.log("🕒 [TICK ENGINE] Processing hourly salaries and rent...");

    try {
      // Find all users with a job paying a salary
      const workers = await User.find({ jobSalary: { $gt: 0 } });
      
      let totalPaidOut = 0;
      for (const worker of workers) {
        // Here we could check if the employer is a Player Company and deduct from their balance.
        // For now, if employerId === 'State', we just print money.
        worker.wallet += worker.jobSalary;
        totalPaidOut += worker.jobSalary;
        await worker.save();
      }

      console.log(`✅ [TICK ENGINE] Paid out 🪙${totalPaidOut} in total salaries to ${workers.length} workers.`);
    } catch (err) {
      console.error("❌ [TICK ENGINE] Error processing salaries:", err);
    }
  });
};
