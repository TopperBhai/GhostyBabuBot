
const User = require('../models/User');
const Business = require('../models/Business');
const Property = require('../models/Property');

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
    
    const properties = await Property.find({ ownerId: targetUser.id });
    const realEstateValue = properties.reduce((acc, p) => acc + p.value, 0);
    
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

    let statusStr = '🟢 Free Citizen';
    if (userRecord.jailUntil && userRecord.jailUntil > new Date()) {
      const unixJail = Math.floor(userRecord.jailUntil.getTime() / 1000);
      statusStr = `🚨 **JAILED** (Releases <t:${unixJail}:R>)`;
    }

    const netWorth = userRecord.wallet + realEstateValue; // Could add more later

    const embed = {
      color: 0xFFD700, // Gold color for premium feel
      author: {
        name: `${targetUser.username}'s GhostVerse Profile`,
        icon_url: targetUser.displayAvatarURL({ dynamic: true })
      },
      description: `**Total Net Worth:** 🪙 **${netWorth.toLocaleString()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      thumbnail: { url: targetUser.displayAvatarURL({ dynamic: true, size: 512 }) },
      fields: [
        { 
          name: '🛂 IDENTIFICATION', 
          value: `**Status:** ${statusStr}\n**Nation:** ${userRecord.nation !== 'None' ? `🚩 ${userRecord.nation}` : 'None'}\n**Cult:** ${userRecord.cult !== 'None' ? `🔮 ${userRecord.cult}` : 'None'}\n**Role:** ${userRecord.role}`, 
          inline: false 
        },
        { 
          name: '💼 CAREER', 
          value: `**Job:** ${userRecord.jobTitle}\n**Salary:** 🪙${userRecord.jobSalary}/h`, 
          inline: true 
        },
        { 
          name: '🏢 BUSINESS EMPIRE', 
          value: `**LLCs Owned:** ${bizCount}\n**Real Estate:** ${properties.length} Props (🪙${realEstateValue.toLocaleString()})`, 
          inline: true 
        },
        { 
          name: '💰 LIQUID ASSETS', 
          value: `**Wallet:** 🪙 ${userRecord.wallet.toLocaleString()}`, 
          inline: false 
        },
        { 
          name: '📈 STOCK PORTFOLIO', 
          value: `\`\`\`\n${portfolioStr}\n\`\`\``, 
          inline: false 
        },
        { 
          name: '💎 RARE ARTIFACTS', 
          value: artifactsStr, 
          inline: false 
        }
      ],
      footer: { text: "GhostVerse OS v2.0 | Advanced Economy Simulation", icon_url: client.user.displayAvatarURL() },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  }
};
