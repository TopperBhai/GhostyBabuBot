const cron = require('node-cron');
const User = require('../models/User');
const Business = require('../models/Business');

module.exports = (client) => {
  // Global Tick Engine: Runs at the start of every hour
  cron.schedule('0 * * * *', async () => {
    console.log("🕒 [TICK ENGINE] Processing hourly salaries and rent...");

    try {
      // Find all users with a job paying a salary
      const workers = await User.find({ jobSalary: { $gt: 0 } });
      
      let totalPaidOut = 0;
      for (const worker of workers) {
        if (worker.employerId === 'State') {
          worker.wallet += worker.jobSalary;
          totalPaidOut += worker.jobSalary;
          await worker.save();
        } else if (worker.employerId !== 'None') {
          // Employee works for a Player Company
          const biz = await Business.findById(worker.employerId);
          if (biz) {
            const owner = await User.findOne({ discordId: biz.ownerId });
            if (owner && owner.wallet >= worker.jobSalary) {
              // Transfer money
              owner.wallet -= worker.jobSalary;
              worker.wallet += worker.jobSalary;
              totalPaidOut += worker.jobSalary;
              await owner.save();
              await worker.save();
            } else {
              // Employer is broke! Fire the employee.
              worker.jobTitle = 'Unemployed';
              worker.jobSalary = 0;
              worker.employerId = 'None';
              await worker.save();
            }
          } else {
            // Business no longer exists
            worker.jobTitle = 'Unemployed';
            worker.jobSalary = 0;
            worker.employerId = 'None';
            await worker.save();
          }
        }
      }

      console.log(`✅ [TICK ENGINE] Paid out 🪙${totalPaidOut} in total salaries to ${workers.length} workers.`);
    } catch (err) {
      console.error("❌ [TICK ENGINE] Error processing salaries:", err);
    }
  });
};
