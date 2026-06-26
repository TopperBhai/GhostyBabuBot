const { EmbedBuilder } = require('discord.js');
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
        const cdEmbed = new EmbedBuilder()
          .setColor('#FF3366')
          .setTitle('⏳ Relief Already Collected')
          .setDescription(`You have already claimed your daily government check.\n\n**Next Claim Available:** in **${hours}h ${mins}m**`)
          .setFooter({ text: 'City Treasury Department' });

        return interaction.reply({ embeds: [cdEmbed], ephemeral: true });
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

    const successEmbed = new EmbedBuilder()
      .setColor('#00FF88')
      .setTitle('🏛️ Daily Relief Deposited')
      .setDescription(`The City Treasury has transferred **🪙${reward} Ghost Coins** directly to your cash wallet.`)
      .addFields(
        { name: '💵 Total Cash', value: `🪙 **${user.wallet.toLocaleString()}**`, inline: true },
        { name: '💡 Pro-Tip', value: 'Use `/work` every 30 mins!', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'GhostVerse Economic Bureau', iconURL: interaction.user.displayAvatarURL() });

    return interaction.reply({ embeds: [successEmbed] });
  }
};
