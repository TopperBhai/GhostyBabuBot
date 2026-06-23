const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const systemsDir = path.join(__dirname, 'src', 'systems');
const commandsDir = path.join(__dirname, 'src', 'commands');

if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
if (!fs.existsSync(systemsDir)) fs.mkdirSync(systemsDir, { recursive: true });

// Models
fs.writeFileSync(path.join(modelsDir, 'User.js'), `
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 0 },
  nation: { type: String, default: 'None' },
  role: { type: String, default: 'Citizen' },
  inventory: { type: Array, default: [] }
});
module.exports = mongoose.model('User', userSchema);
`);

fs.writeFileSync(path.join(modelsDir, 'Nation.js'), `
const mongoose = require('mongoose');
const nationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  population: { type: Number, default: 0 },
  treasury: { type: Number, default: 0 },
  gdp: { type: Number, default: 0 },
  happiness: { type: Number, default: 100 },
  powerScore: { type: Number, default: 100 },
  leaderId: { type: String, default: null }
});
module.exports = mongoose.model('Nation', nationSchema);
`);

// Commands
fs.writeFileSync(path.join(commandsDir, 'join.js'), `
const User = require('../models/User');
const Nation = require('../models/Nation');

module.exports = {
  data: {
    name: 'join',
    description: 'Pledge your allegiance to a Nation.',
    options: [
      {
        name: 'nation',
        description: 'Choose a nation',
        type: 3,
        required: true,
        choices: [
          { name: 'Shadow Empire', value: 'Shadow Empire' },
          { name: 'Frost Union', value: 'Frost Union' },
          { name: 'Crimson Kingdom', value: 'Crimson Kingdom' },
          { name: 'Neon Republic', value: 'Neon Republic' },
          { name: 'Lost Souls', value: 'Lost Souls' }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const nationName = interaction.options.getString('nation');
    const discordId = interaction.user.id;

    let user = await User.findOne({ discordId });
    if (!user) user = new User({ discordId });

    if (user.nation !== 'None') {
      return interaction.reply({ content: \`You are already a citizen of the **\${user.nation}**. Treason is punishable by death.\`, ephemeral: true });
    }

    user.nation = nationName;
    await user.save();

    await Nation.updateOne({ name: nationName }, { $inc: { population: 1 } });

    await interaction.reply(\`⚔️ <@\${discordId}> has pledged their allegiance to the **\${nationName}**! Welcome to the ranks, Citizen.\`);
  }
};
`);

fs.writeFileSync(path.join(commandsDir, 'profile.js'), `
const User = require('../models/User');

module.exports = {
  data: {
    name: 'profile',
    description: 'View your GhostVerse profile and net worth.',
    options: [
      { name: 'user', description: 'View someone else\\'s profile', type: 6, required: false }
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
      title: \`\${targetUser.username}'s Profile\`,
      thumbnail: { url: targetUser.displayAvatarURL() },
      fields: [
        { name: 'Nation', value: userRecord.nation, inline: true },
        { name: 'Role', value: userRecord.role, inline: true },
        { name: 'Ghost Coins', value: \`🪙 \${userRecord.wallet.toLocaleString()}\`, inline: false },
      ]
    };

    await interaction.reply({ embeds: [embed] });
  }
};
`);

fs.writeFileSync(path.join(commandsDir, 'nation.js'), `
const Nation = require('../models/Nation');

module.exports = {
  data: {
    name: 'nation',
    description: 'View the statistics of a specific Nation.',
    options: [
      {
        name: 'name',
        description: 'Choose a nation',
        type: 3,
        required: true,
        choices: [
          { name: 'Shadow Empire', value: 'Shadow Empire' },
          { name: 'Frost Union', value: 'Frost Union' },
          { name: 'Crimson Kingdom', value: 'Crimson Kingdom' },
          { name: 'Neon Republic', value: 'Neon Republic' },
          { name: 'Lost Souls', value: 'Lost Souls' }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const nationName = interaction.options.getString('name');
    const n = await Nation.findOne({ name: nationName });
    
    if (!n) return interaction.reply({ content: "Nation data corrupted.", ephemeral: true });

    let leaderMention = n.leaderId ? \`<@\${n.leaderId}>\` : 'No Leader (Election Pending)';

    const embed = {
      color: 0x992d22,
      title: \`🗺️ \${n.name}\`,
      fields: [
        { name: 'Leader', value: leaderMention, inline: true },
        { name: 'Population', value: \`👥 \${n.population}\`, inline: true },
        { name: 'Treasury', value: \`🪙 \${n.treasury.toLocaleString()}\`, inline: true },
        { name: 'GDP', value: \`📈 \${n.gdp.toLocaleString()}\`, inline: true },
        { name: 'Power Score', value: \`⚔️ \${n.powerScore}\`, inline: true },
      ]
    };

    await interaction.reply({ embeds: [embed] });
  }
};
`);

// Systems
fs.writeFileSync(path.join(systemsDir, 'ghostLeaks.js'), `
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
`);

console.log("Phase 2 modules generated.");
