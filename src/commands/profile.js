
const User = require('../models/User');

module.exports = {
  data: {
    name: 'profile',
    description: 'View your GhostVerse profile and net worth.',
    options: [
      { name: 'user', description: 'View someone else\'s profile', type: 6, required: false }
    ]
  },
  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    let userRecord = await User.findOne({ discordId: targetUser.id });
    if (!userRecord) {
      return interaction.reply({ content: "This user hasn't stepped into the GhostVerse yet.", ephemeral: true });
    }

    const embed = {
      color: 0x2b2d31,
      title: `${targetUser.username}'s Profile`,
      thumbnail: { url: targetUser.displayAvatarURL() },
      fields: [
        { name: 'Nation', value: userRecord.nation, inline: true },
        { name: 'Role', value: userRecord.role, inline: true },
        { name: 'Ghost Coins', value: `🪙 ${userRecord.wallet.toLocaleString()}`, inline: false },
      ]
    };

    await interaction.reply({ embeds: [embed] });
  }
};
