
const cron = require('node-cron');
const Nation = require('../models/Nation');

module.exports = (client) => {
  // Runs every day at 6 PM
  cron.schedule('0 18 * * *', async () => {
    try {
      const nations = await Nation.find().sort({ treasury: -1 });
      if (nations.length < 2) return;

      const topNation = nations[0];
      const bottomNation = nations[nations.length - 1];

      const embed = {
        color: 0xffffff,
        title: "📰 Ghost Times Daily",
        description: "*The only trusted news source in the GhostVerse.*",
        fields: [
          { name: "Global Superpower", value: `The **${topNation.name}** is dominating the globe with a treasury of 🪙${topNation.treasury.toLocaleString()}.` },
          { name: "Economic Crisis", value: `Meanwhile, the **${bottomNation.name}** is struggling to survive with only 🪙${bottomNation.treasury.toLocaleString()}.` },
          { name: "Rumors", value: "Police reports indicate a massive spike in Black Market Sabotage Kits being purchased..." }
        ],
        footer: { text: "Published by Ghosty Babu's Press" }
      };

      const guilds = Array.from(client.guilds.cache.values());
      for (const guild of guilds) {
        const textChannels = Array.from(guild.channels.cache.filter(c => c.type === 0).values());
        if (textChannels.length > 0) {
          const randomChannel = textChannels[Math.floor(Math.random() * textChannels.length)];
          await randomChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
    } catch(e) { console.error("Newspaper error:", e) }
  });
};
