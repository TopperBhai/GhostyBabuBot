
const User = require('../models/User');
const Business = require('../models/Business');

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

    const bizCount = await Business.countDocuments({ ownerId: targetUser.id });
    
    let portfolioStr = "";
    if (userRecord.portfolio) {
      for (const [company, shares] of Object.entries(userRecord.portfolio)) {
        portfolioStr += `${company}: ${shares} shares\n`;
      }
    }
    if (portfolioStr === "") portfolioStr = "No investments.";

    let artifactsStr = "";
    if (userRecord.inventory) {
      const artifacts = userRecord.inventory.filter(i => i.type === 'Artifact');
      artifactsStr = artifacts.map(a => `${a.emoji} ${a.name}`).join('\n');
    }
    if (artifactsStr === "") artifactsStr = "None";

    let statusStr = 'Free Citizen';
    if (userRecord.jailUntil && userRecord.jailUntil > new Date()) {
      statusStr = `🚨 Jailed until ${userRecord.jailUntil.toLocaleString()}`;
    }

    const embed = {
      color: 0x2b2d31,
      title: `${targetUser.username}'s Profile`,
      thumbnail: { url: targetUser.displayAvatarURL() },
      fields: [
        { name: 'Status', value: statusStr, inline: false },
        { name: 'Nation', value: userRecord.nation, inline: true },
        { name: 'Cult', value: userRecord.cult || 'None', inline: true },
        { name: 'Role', value: userRecord.role, inline: true },
        { name: 'Businesses', value: `🏢 ${bizCount}`, inline: true },
        { name: 'Ghost Coins', value: `🪙 ${userRecord.wallet.toLocaleString()}`, inline: false },
        { name: 'Stock Portfolio', value: portfolioStr, inline: false },
        { name: 'Custom Artifacts', value: artifactsStr, inline: false },
      ]
    };

    await interaction.reply({ embeds: [embed] });
  }
};
