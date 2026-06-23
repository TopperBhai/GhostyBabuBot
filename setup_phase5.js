const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const commandsDir = path.join(__dirname, 'src', 'commands');

// 1. Update User Schema with cult
const userSchemaContent = `
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 0 },
  nation: { type: String, default: 'None' },
  role: { type: String, default: 'Citizen' },
  inventory: { type: Array, default: [] }, // Custom artifacts go here too
  portfolio: { type: Object, default: {} },
  jailUntil: { type: Date, default: null },
  cult: { type: String, default: 'None' }
});
module.exports = mongoose.model('User', userSchema);
`;
fs.writeFileSync(path.join(modelsDir, 'User.js'), userSchemaContent);

// 2. Cult Schema
fs.writeFileSync(path.join(modelsDir, 'Cult.js'), `
const mongoose = require('mongoose');
const cultSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  founderId: { type: String, required: true },
  perk: { type: String, required: true }, // Thieves Guild, Capitalists, Warmongers
  followers: { type: Number, default: 1 }
});
module.exports = mongoose.model('Cult', cultSchema);
`);

// 3. Cult Command
fs.writeFileSync(path.join(commandsDir, 'cult.js'), `
const User = require('../models/User');
const Cult = require('../models/Cult');

module.exports = {
  data: {
    name: 'cult',
    description: 'Religions of the GhostVerse.',
    options: [
      {
        name: 'found',
        description: 'Spend 🪙500,000 to found a Cult.',
        type: 1,
        options: [
          { name: 'name', description: 'Cult Name', type: 3, required: true },
          { name: 'perk', description: 'Cult Buff', type: 3, required: true, choices: [
            { name: 'Thieves Guild (+10% Heist Chance)', value: 'Thieves Guild' },
            { name: 'Capitalists (+20% Business Revenue)', value: 'Capitalists' },
            { name: 'Warmongers (+15% Nation Attack Power)', value: 'Warmongers' }
          ]}
        ]
      },
      {
        name: 'join',
        description: 'Join an existing Cult.',
        type: 1,
        options: [
          { name: 'name', description: 'Cult Name', type: 3, required: true }
        ]
      },
      {
        name: 'info',
        description: 'View Cult details.',
        type: 1,
        options: [
          { name: 'name', description: 'Cult Name', type: 3, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });

    if (!user) return interaction.reply({ content: "You don't exist.", ephemeral: true });

    if (sub === 'found') {
      const name = interaction.options.getString('name');
      const perk = interaction.options.getString('perk');

      if (user.wallet < 500000) {
        return interaction.reply({ content: "You need 🪙500,000 Ghost Coins to found a cult.", ephemeral: true });
      }

      const existing = await Cult.findOne({ name: new RegExp('^' + name + '$', 'i') });
      if (existing) return interaction.reply({ content: "A cult with that name already exists.", ephemeral: true });

      if (user.cult !== 'None') {
        const oldCult = await Cult.findOne({ name: user.cult });
        if (oldCult) {
          oldCult.followers -= 1;
          await oldCult.save();
        }
      }

      user.wallet -= 500000;
      user.cult = name;
      await user.save();

      await new Cult({ name, founderId: discordId, perk, followers: 1 }).save();

      return interaction.reply(\`🔮 **ALL HAIL!** <@\${discordId}> has founded the **\${name}** cult! Their followers gain the **\${perk}** buff.\`);
    }

    if (sub === 'join') {
      const name = interaction.options.getString('name');
      const targetCult = await Cult.findOne({ name: new RegExp('^' + name + '$', 'i') });
      if (!targetCult) return interaction.reply({ content: "That cult doesn't exist.", ephemeral: true });

      if (user.cult === targetCult.name) return interaction.reply({ content: "You are already in that cult.", ephemeral: true });

      if (user.cult !== 'None') {
        const oldCult = await Cult.findOne({ name: user.cult });
        if (oldCult) {
          oldCult.followers -= 1;
          await oldCult.save();
        }
      }

      user.cult = targetCult.name;
      await user.save();

      targetCult.followers += 1;
      await targetCult.save();

      return interaction.reply(\`🩸 <@\${discordId}> has pledged their soul to **\${targetCult.name}**.\`);
    }

    if (sub === 'info') {
      const name = interaction.options.getString('name');
      const targetCult = await Cult.findOne({ name: new RegExp('^' + name + '$', 'i') });
      if (!targetCult) return interaction.reply({ content: "That cult doesn't exist.", ephemeral: true });

      return interaction.reply(\`🔮 **\${targetCult.name}**\\n👑 **Founder:** <@\${targetCult.founderId}>\\n👥 **Followers:** \${targetCult.followers}\\n⚡ **Buff:** \${targetCult.perk}\`);
    }
  }
};
`);

// 4. Mint Command
fs.writeFileSync(path.join(commandsDir, 'mint.js'), `
const User = require('../models/User');

module.exports = {
  data: {
    name: 'mint',
    description: 'Spend 🪙1,000,000 to forge a Custom Artifact.',
    options: [
      { name: 'emoji', description: 'An emoji for the item', type: 3, required: true },
      { name: 'name', description: 'Name of your artifact', type: 3, required: true }
    ]
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });

    if (!user || user.wallet < 1000000) {
      return interaction.reply({ content: "You are too poor. Minting an artifact costs 🪙1,000,000.", ephemeral: true });
    }

    const emoji = interaction.options.getString('emoji');
    const name = interaction.options.getString('name');

    user.wallet -= 1000000;
    user.inventory.push({ type: 'Artifact', emoji, name, mintedAt: Date.now() });
    user.markModified('inventory');
    await user.save();

    return interaction.reply(\`✨ **DIVINE FORGE!**\\n<@\${discordId}> has spent 🪙1,000,000 to forge the Custom Artifact: **\${emoji} \${name}**!\`);
  }
};
`);

// 5. Leaderboard Command
fs.writeFileSync(path.join(commandsDir, 'leaderboard.js'), `
const User = require('../models/User');
const Nation = require('../models/Nation');
const Cult = require('../models/Cult');

module.exports = {
  data: {
    name: 'leaderboard',
    description: 'View the GhostVerse Global Leaderboards.',
    options: []
  },
  async execute(interaction, client) {
    const topUsers = await User.find().sort({ wallet: -1 }).limit(3);
    const topNations = await Nation.find().sort({ powerScore: -1 }).limit(3);
    const topCults = await Cult.find().sort({ followers: -1 }).limit(3);

    let uStr = topUsers.map((u, i) => \`**\${i+1}.** <@\${u.discordId}> - 🪙\${u.wallet.toLocaleString()}\`).join('\\n') || "None";
    let nStr = topNations.map((n, i) => \`**\${i+1}.** \${n.name} - ⚔️\${Math.floor(n.powerScore)}\`).join('\\n') || "None";
    let cStr = topCults.map((c, i) => \`**\${i+1}.** \${c.name} - 👥\${c.followers}\`).join('\\n') || "None";

    const embed = {
      color: 0xffd700,
      title: "🏆 GhostVerse Global Leaderboards",
      fields: [
        { name: "💰 Richest Citizens", value: uStr },
        { name: "🗺️ Strongest Nations", value: nStr },
        { name: "🔮 Largest Cults", value: cStr }
      ]
    };

    return interaction.reply({ embeds: [embed] });
  }
};
`);

console.log("Phase 5 base files generated.");
