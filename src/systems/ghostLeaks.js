
const cron = require('node-cron');
const User = require('../models/User');

module.exports = (client) => {
  // Run every 2 hours to drop a random leak in a random active channel
  cron.schedule('0 */2 * * *', async () => {
    try {
      const topUsers = await User.find().sort({ wallet: -1 }).limit(10);
      if (topUsers.length === 0) return;

      const randomLeak = [
        "A little bird told me someone is hoarding over " + topUsers[0].wallet + " Ghost Coins...",
        "Rumors say the " + (topUsers[1]?.nation || 'Unknown Nation') + " is preparing for something big...",
        "Ghosty Babu sees everything. Even the secret bribes happening in the shadows.",
        "Someone just got a massive payout in the Underworld..."
      ];

      const leakMsg = "🚨 **GhostLeaks Alert:** " + randomLeak[Math.floor(Math.random() * randomLeak.length)];

      const guilds = Array.from(client.guilds.cache.values());
      for (const guild of guilds) {
        const textChannels = Array.from(guild.channels.cache.filter(c => c.type === 0).values());
        if (textChannels.length > 0) {
          const randomChannel = textChannels[Math.floor(Math.random() * textChannels.length)];
          await randomChannel.send(leakMsg).catch(() => {});
        }
      }
    } catch(e) { console.error("GhostLeaks error:", e) }
  });
};
