const User = require('../models/User');

module.exports = {
  data: {
    name: 'daily',
    description: 'Collect your daily citizen relief stipend from the City Treasury.',
    options: []
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;

    // Cooldown check via Redis (24 hours = 86400 seconds)
    if (client.redis) {
      const cdKey = `cd_daily_${discordId}`;
      const ttl = await client.redis.ttl(cdKey);
      if (ttl > 0) {
        const hours = Math.floor(ttl / 3600);
        const mins = Math.floor((ttl % 3600) / 60);
        return interaction.reply({
          content: `⏳ You have already collected your daily stipend. Try again in **${hours}h ${mins}m**.`,
          ephemeral: true
        });
      }
      await client.redis.set(cdKey, '1', 'EX', 86400);
    }

    const reward = 100; // 🪙100 solid starter money
    let user = await User.findOne({ discordId });
    if (!user) {
      user = new User({ discordId, wallet: 500 });
    }

    user.wallet += reward;
    await user.save();

    return interaction.reply(`🏛️ **GOVERNMENT RELIEF:** You collected your daily citizen stipend of **🪙${reward}**! Current cash: **🪙${user.wallet.toLocaleString()}**.\n💡 *Tip: Use \`/work\` every 30 minutes for extra side income!*`);
  }
};
