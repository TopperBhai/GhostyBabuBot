
const cron = require('node-cron');
const Stock = require('../models/Stock');

module.exports = (client) => {
  // Run once a day at noon
  cron.schedule('0 12 * * *', async () => {
    try {
      if (Math.random() > 0.2) return; // 20% chance of a disaster/boom each day

      const isBoom = Math.random() > 0.5;
      const stocks = await Stock.find();
      if (stocks.length === 0) return;

      const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
      
      let msg = "";
      if (isBoom) {
        randomStock.price *= 2; // Price doubles
        randomStock.trend = 'BULL';
        msg = `🚀 **ECONOMIC BOOM!** ${randomStock.name} just secured a massive government contract. Stock prices have DOUBLED!`;
      } else {
        randomStock.price *= 0.5; // Price halves
        randomStock.trend = 'BEAR';
        msg = `📉 **DISASTER STRUCK!** A massive scandal has hit ${randomStock.name}. Stock prices have HALVED!`;
      }

      await randomStock.save();

      // Broadcast to channels
      const guilds = Array.from(client.guilds.cache.values());
      for (const guild of guilds) {
        const textChannels = Array.from(guild.channels.cache.filter(c => c.type === 0).values());
        if (textChannels.length > 0) {
          const randomChannel = textChannels[Math.floor(Math.random() * textChannels.length)];
          await randomChannel.send(msg).catch(() => {});
        }
      }
    } catch(e) { console.error("Disasters error:", e) }
  });
};
