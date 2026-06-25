const cron = require('node-cron');
const User = require('../models/User');
const Business = require('../models/Business');
const Market = require('../models/Market');
const State = require('../models/State');

module.exports = (client) => {
  // Global Tick Engine: Runs every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log("🕒 [TICK ENGINE] Processing every 10 mins (salaries, production, rent)...");

    try {
      // Find all users with a job paying a salary, who were active in the last 24 hours
      const activeCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const workers = await User.find({ 
        jobSalary: { $gt: 0 },
        lastActive: { $gte: activeCutoff }
      });
      
      // Global State object for taxes/payroll
      let state = await State.findOne({ id: 'GLOBAL' });
      if (!state) state = await new State({ id: 'GLOBAL' }).save();

      let totalPaidOut = 0;
      let statePaidOut = 0;
      for (const worker of workers) {
        if (worker.employerId === 'State') {
          if (state.treasury >= worker.jobSalary) {
            state.treasury -= worker.jobSalary;
            worker.wallet += worker.jobSalary;
            statePaidOut += worker.jobSalary;
            await worker.save();
          } else {
            // STATE BANKRUPTCY - No pay this hour
          }
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

      await state.save();
      console.log(`✅ [TICK ENGINE] State paid out 🪙${statePaidOut}. Total private payroll: 🪙${totalPaidOut}`);

      // ==========================================
      // 2. SUPPLY CHAIN PRODUCTION
      // ==========================================
      const businesses = await Business.find();
      for (const b of businesses) {
        let inv = b.inventory || {};
        const level = b.level || 1;

        if (b.type === 'Farm') {
          inv['Food'] = (inv['Food'] || 0) + (10 * level);
        } else if (b.type === 'Mine') {
          inv['Ore'] = (inv['Ore'] || 0) + (10 * level);
        } else if (b.type === 'Factory') {
          if (inv['Ore'] >= 5 * level) {
            inv['Ore'] -= 5 * level;
            inv['Goods'] = (inv['Goods'] || 0) + (5 * level);
          }
        } else if (b.type === 'Restaurant') {
          if (inv['Food'] >= 5 * level) {
            inv['Food'] -= 5 * level;
            inv['Meals'] = (inv['Meals'] || 0) + (5 * level);
          }
        }

        b.inventory = inv;
        b.markModified('inventory');
        await b.save();
      }
      console.log(`✅ [TICK ENGINE] Supply chains processed.`);

      // ==========================================
      // 3. NPC CONSUMER ECONOMY & PRICE CAPS
      // ==========================================
      const MAX_PRICES = { 'Food': 100, 'Ore': 200, 'Goods': 1000, 'Meals': 500 };
      const MIN_PRICES = { 'Food': 5, 'Ore': 10, 'Goods': 50, 'Meals': 25 };

      const markets = await Market.find();
      for (const m of markets) {
        if (m.commodity === 'Meals' || m.commodity === 'Goods') {
          // NPCs consume finished products
          const consumed = Math.min(m.supply, m.demand);
          m.supply -= consumed;
          
          // Adjust Price based on Scarcity
          if (m.supply === 0) {
            m.price = Math.floor(m.price * 1.02); // +2% price (gentle)
            m.demand = Math.min(10000, Math.floor(m.demand * 1.02)); // Capped demand
          } else if (m.supply > m.demand) {
            m.price = Math.floor(m.price * 0.95); // -5% price
          }
        } else {
          // Raw materials (Food, Ore) decay slowly if not bought
          m.supply = Math.max(0, m.supply - 50);
        }

        // Hard Price Caps (Anti-Hyperinflation)
        const maxP = MAX_PRICES[m.commodity] || 500;
        const minP = MIN_PRICES[m.commodity] || 10;
        if (m.price > maxP) m.price = maxP;
        if (m.price < minP) m.price = minP;

        await m.save();
      }
      console.log(`✅ [TICK ENGINE] NPC Consumption & Price Caps processed.`);

    } catch (err) {
      console.error("❌ [TICK ENGINE] Error processing salaries:", err);
    }
  });
};
