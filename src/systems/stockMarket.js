
const cron = require('node-cron');
const Stock = require('../models/Stock');

module.exports = (client) => {
  // Run every 1 minute to fluctuate prices rapidly
  cron.schedule('*/1 * * * *', async () => {
    try {
      const stocks = await Stock.find();
      for (const s of stocks) {
        // Save previous price for UI calculations
        s.previousPrice = s.price;

        // 15% chance to change trend (higher volatility)
        if (Math.random() < 0.15) {
          const trends = ['BULL', 'BEAR', 'STABLE'];
          s.trend = trends[Math.floor(Math.random() * trends.length)];
        }

        let changePercent = (Math.random() * s.volatility);
        if (s.trend === 'BULL') changePercent = Math.abs(changePercent);
        else if (s.trend === 'BEAR') changePercent = -Math.abs(changePercent);
        else changePercent = (Math.random() > 0.5 ? 1 : -1) * (changePercent / 2); // Stable fluctuates slightly

        s.price = s.price * (1 + (changePercent / 100));
        
        // Hard limits so economy doesn't break entirely
        if (s.price < 5) s.price = 5;
        if (s.price > 50000) s.price = 50000;

        await s.save();
      }
      console.log("Stock Market prices updated.");
    } catch(e) { console.error("StockMarket error:", e) }
  });
};
