const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

const SIDE_GIGS = [
  "You washed ghost cars at the haunted mall",
  "You walked an invisible ghost dog",
  "You fixed a lagging server rack for TopperBhai",
  "You delivered spooky pizzas across GhostVerse",
  "You helped an old spirit cross the digital road",
  "You cleaned ectoplasm off the Wall Street trading floor",
  "You tutored a zombie in basic JavaScript",
  "You drove a getaway rickshaw for a clumsy smuggler"
];

module.exports = {
  data: {
    name: 'work',
    description: 'Do a quick odd-job side hustle for instant cash. (30 min cooldown)',
    options: []
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;

    // Cooldown check via Redis (30 mins = 1800 seconds)
    if (client.redis) {
      const cdKey = `cd_work_${discordId}`;
      const ttl = await client.redis.ttl(cdKey);
      if (ttl > 0) {
        const mins = Math.floor(ttl / 60);
        const secs = ttl % 60;
        const cdEmbed = new EmbedBuilder()
          .setColor('#FF3366')
          .setTitle('🥵 Worker Fatigue')
          .setDescription(`You are exhausted from your last side-hustle.\n\n**Rest Required:** **${mins}m ${secs}s**`)
          .setFooter({ text: 'City Labor Bureau' });

        return interaction.reply({ embeds: [cdEmbed], ephemeral: true });
      }
      await client.redis.set(cdKey, '1', 'EX', 1800);
    }

    const gig = SIDE_GIGS[Math.floor(Math.random() * SIDE_GIGS.length)];
    const earnings = Math.floor(Math.random() * 26) + 15; // 🪙15 - 40 coins

    let user = await User.findOne({ discordId });
    if (!user) {
      user = new User({ discordId, wallet: 500 });
    }

    user.wallet += earnings;
    await user.save();

    const workEmbed = new EmbedBuilder()
      .setColor('#00AAFF')
      .setTitle('🛠️ Side-Gig Shift Done')
      .setDescription(`**${gig}**!`)
      .addFields(
        { name: '💵 Payment Received', value: `+ 🪙 **${earnings}**`, inline: true },
        { name: '💰 Total Wallet', value: `🪙 **${user.wallet.toLocaleString()}**`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'GhostVerse Gig Economy', iconURL: interaction.user.displayAvatarURL() });

    return interaction.reply({ embeds: [workEmbed] });
  }
};
