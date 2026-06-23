const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const commandsDir = path.join(__dirname, 'src', 'commands');
const systemsDir = path.join(__dirname, 'src', 'systems');

// 1. Update User Schema with jailUntil
const userSchemaContent = `
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 0 },
  nation: { type: String, default: 'None' },
  role: { type: String, default: 'Citizen' },
  inventory: { type: Array, default: [] },
  portfolio: { type: Object, default: {} },
  jailUntil: { type: Date, default: null }
});
module.exports = mongoose.model('User', userSchema);
`;
fs.writeFileSync(path.join(modelsDir, 'User.js'), userSchemaContent);

// 2. Heist Command
fs.writeFileSync(path.join(commandsDir, 'heist.js'), `
const User = require('../models/User');

module.exports = {
  data: {
    name: 'heist',
    description: 'Rob the central bank. High risk, high reward. Failure means PRISON.',
    options: []
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });

    if (!user) return interaction.reply({ content: "You don't exist yet.", ephemeral: true });

    // Check if Jailed
    if (user.jailUntil && user.jailUntil > new Date()) {
      return interaction.reply({ content: \`You are in PRISON until \${user.jailUntil.toLocaleString()}. Use /blackmarket or bribe someone to get out.\`, ephemeral: true });
    }

    // Cooldown check via Redis
    if (client.redis) {
      const isCooldown = await client.redis.get(\`heist_cd_\${discordId}\`);
      if (isCooldown) {
        return interaction.reply({ content: "The cops are still looking for you. Wait before doing another heist.", ephemeral: true });
      }
      await client.redis.set(\`heist_cd_\${discordId}\`, '1', 'EX', 3600); // 1 hour cooldown
    }

    let successChance = 0.3; // 30% base chance

    // Check inventory for Sabotage Kit
    const hasKitIndex = user.inventory.findIndex(i => i.type === 'Sabotage Kit');
    if (hasKitIndex !== -1) {
      successChance += 0.2; // 50% chance with kit
      user.inventory.splice(hasKitIndex, 1); // Consume item
      user.markModified('inventory');
    }

    const isSuccess = Math.random() < successChance;

    if (isSuccess) {
      const loot = Math.floor(Math.random() * 50000) + 10000; // 10k-60k
      user.wallet += loot;
      await user.save();
      return interaction.reply(\`🔫 **HEIST SUCCESSFUL!** You hacked the mainframe and stole 🪙**\${loot.toLocaleString()}**. The police are clueless.\`);
    } else {
      // PRISON TIME! (6 hours)
      const releaseDate = new Date(Date.now() + 6 * 60 * 60 * 1000);
      user.jailUntil = releaseDate;
      
      // Fine them 10% of their net worth
      const fine = Math.floor(user.wallet * 0.10);
      user.wallet -= fine;

      await user.save();
      return interaction.reply(\`🚨 **BUSTED!** The SWAT team breached the bank. You lost 🪙**\${fine.toLocaleString()}** and have been sentenced to **PRISON** until \${releaseDate.toLocaleString()}.\`);
    }
  }
};
`);

// 3. Black Market Command
fs.writeFileSync(path.join(commandsDir, 'blackmarket.js'), `
const User = require('../models/User');

const BM_ITEMS = {
  'Sabotage Kit': { cost: 15000, desc: 'Increases heist success chance by 20% (Consumable)' },
  'Fake Passport': { cost: 50000, desc: 'Instantly clears your prison sentence (Consumable)' }
};

module.exports = {
  data: {
    name: 'blackmarket',
    description: 'Welcome to the Underworld Shop.',
    options: [
      {
        name: 'buy',
        description: 'Buy an illegal item',
        type: 1,
        options: [
          {
            name: 'item',
            description: 'Item name',
            type: 3,
            required: true,
            choices: Object.keys(BM_ITEMS).map(k => ({ name: k + \` (🪙\${BM_ITEMS[k].cost})\`, value: k }))
          }
        ]
      },
      {
        name: 'use_passport',
        description: 'Use a Fake Passport to escape prison.',
        type: 1
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });

    if (!user) return interaction.reply({ content: "Who are you?", ephemeral: true });

    if (sub === 'buy') {
      const itemName = interaction.options.getString('item');
      const itemConfig = BM_ITEMS[itemName];

      if (user.wallet < itemConfig.cost) {
        return interaction.reply({ content: \`You don't have enough Ghost Coins. You need 🪙\${itemConfig.cost}.\`, ephemeral: true });
      }

      user.wallet -= itemConfig.cost;
      user.inventory.push({ type: itemName, boughtAt: Date.now() });
      user.markModified('inventory');
      await user.save();

      return interaction.reply({ content: \`🕵️ You secretly purchased a **\${itemName}**. Watch your back.\`, ephemeral: true });
    }

    if (sub === 'use_passport') {
      if (!user.jailUntil || user.jailUntil < new Date()) {
        return interaction.reply({ content: "You aren't even in prison, dumbass.", ephemeral: true });
      }

      const passportIndex = user.inventory.findIndex(i => i.type === 'Fake Passport');
      if (passportIndex === -1) {
        return interaction.reply({ content: "You don't have a Fake Passport.", ephemeral: true });
      }

      user.inventory.splice(passportIndex, 1);
      user.jailUntil = null;
      user.markModified('inventory');
      await user.save();

      return interaction.reply(\`🚁 **PRISON BREAK!** <@\${discordId}> used a Fake Passport and escaped from GhostVerse Penitentiary!\`);
    }
  }
};
`);

// 4. War Command
fs.writeFileSync(path.join(commandsDir, 'war.js'), `
const User = require('../models/User');
const Nation = require('../models/Nation');

module.exports = {
  data: {
    name: 'war',
    description: 'Declare war on another nation. High stakes.',
    options: [
      {
        name: 'declare',
        description: 'Declare war on a rival nation',
        type: 1,
        options: [
          {
            name: 'target',
            description: 'The nation to attack',
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
      }
    ]
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    const user = await User.findOne({ discordId });

    if (!user || user.nation === 'None') {
      return interaction.reply({ content: "You don't belong to a nation.", ephemeral: true });
    }

    const attackerNationName = user.nation;
    const targetNationName = interaction.options.getString('target');

    if (attackerNationName === targetNationName) {
      return interaction.reply({ content: "You can't declare war on your own nation!", ephemeral: true });
    }

    const attacker = await Nation.findOne({ name: attackerNationName });
    const defender = await Nation.findOne({ name: targetNationName });

    if (!attacker || !defender) return interaction.reply({ content: "Nation data missing.", ephemeral: true });

    // Cooldown
    if (client.redis) {
      const cd = await client.redis.get(\`war_cd_\${attackerNationName}\`);
      if (cd) return interaction.reply({ content: \`Your nation is recovering. Wait before attacking again.\`, ephemeral: true });
      await client.redis.set(\`war_cd_\${attackerNationName}\`, '1', 'EX', 24 * 3600); // 24 hours
    }

    // Battle Math
    const attackPower = attacker.powerScore + (Math.random() * 50);
    const defensePower = defender.powerScore + (Math.random() * 50);

    await interaction.reply(\`⚔️ **WAR DECLARED!**\\n<@\${discordId}> has ordered the **\${attackerNationName}** to attack the **\${targetNationName}**!\\n\\n*Calculating casualties...*\`);

    setTimeout(async () => {
      if (attackPower > defensePower) {
        // Attacker wins! Steals 10% of treasury
        const loot = Math.floor(defender.treasury * 0.10);
        attacker.treasury += loot;
        defender.treasury -= loot;
        
        attacker.powerScore += 5;
        defender.powerScore -= 5;

        await attacker.save();
        await defender.save();

        interaction.channel.send(\`🏆 **VICTORY!** The **\${attackerNationName}** crushed the **\${targetNationName}** and looted 🪙**\${loot.toLocaleString()}** Ghost Coins!\`);
      } else {
        // Defender wins! Attacker loses 10% to defender
        const penalty = Math.floor(attacker.treasury * 0.10);
        attacker.treasury -= penalty;
        defender.treasury += penalty;

        attacker.powerScore -= 5;
        defender.powerScore += 5;

        await attacker.save();
        await defender.save();

        interaction.channel.send(\`🛡️ **DEFENSE SUCCESS!** The **\${targetNationName}** repelled the attack! They seized 🪙**\${penalty.toLocaleString()}** from the fleeing **\${attackerNationName}** soldiers!\`);
      }
    }, 5000); // 5 seconds drama suspense
  }
};
`);

// 5. Newspaper System
fs.writeFileSync(path.join(systemsDir, 'newspaper.js'), `
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
          { name: "Global Superpower", value: \`The **\${topNation.name}** is dominating the globe with a treasury of 🪙\${topNation.treasury.toLocaleString()}.\` },
          { name: "Economic Crisis", value: \`Meanwhile, the **\${bottomNation.name}** is struggling to survive with only 🪙\${bottomNation.treasury.toLocaleString()}.\` },
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
`);

console.log("Phase 4 scripts generated.");
