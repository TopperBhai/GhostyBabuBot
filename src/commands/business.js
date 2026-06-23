
const User = require('../models/User');
const Business = require('../models/Business');

const BIZ_CONFIG = {
  'Mine': { cost: 5000, baseIncome: 100, collectInterval: 1 * 60 * 60 * 1000 }, // 1 hr
  'Factory': { cost: 20000, baseIncome: 600, collectInterval: 3 * 60 * 60 * 1000 }, // 3 hr
  'Bank': { cost: 100000, baseIncome: 5000, collectInterval: 12 * 60 * 60 * 1000 }, // 12 hr
  'Casino': { cost: 250000, baseIncome: 15000, collectInterval: 24 * 60 * 60 * 1000, risk: true } // 24 hr
};

module.exports = {
  data: {
    name: 'business',
    description: 'Capitalism awaits. Buy, upgrade, and collect from your businesses.',
    options: [
      {
        name: 'buy',
        description: 'Buy a new business',
        type: 1,
        options: [
          {
            name: 'type',
            description: 'Type of business',
            type: 3,
            required: true,
            choices: Object.keys(BIZ_CONFIG).map(k => ({ name: k + ` (🪙${BIZ_CONFIG[k].cost})`, value: k }))
          }
        ]
      },
      {
        name: 'collect',
        description: 'Collect passive revenue from your businesses',
        type: 1
const User = require('../models/User');
const Business = require('../models/Business');

const BIZ_CONFIG = {
  'Mine': { cost: 5000, baseIncome: 100, collectInterval: 1 * 60 * 60 * 1000 }, // 1 hr
  'Factory': { cost: 20000, baseIncome: 600, collectInterval: 3 * 60 * 60 * 1000 }, // 3 hr
  'Bank': { cost: 100000, baseIncome: 5000, collectInterval: 12 * 60 * 60 * 1000 }, // 12 hr
  'Casino': { cost: 250000, baseIncome: 15000, collectInterval: 24 * 60 * 60 * 1000, risk: true } // 24 hr
};

module.exports = {
  data: {
    name: 'business',
    description: 'Capitalism awaits. Buy, upgrade, and collect from your businesses.',
    options: [
      {
        name: 'buy',
        description: 'Buy a new business',
        type: 1,
        options: [
          {
            name: 'type',
            description: 'Type of business',
            type: 3,
            required: true,
            choices: Object.keys(BIZ_CONFIG).map(k => ({ name: k + ` (🪙${BIZ_CONFIG[k].cost})`, value: k }))
          }
        ]
      },
      {
        name: 'collect',
        description: 'Collect passive revenue from your businesses',
        type: 1
      },
      {
        name: 'list',
        description: 'View your owned businesses',
        type: 1
      },
      {
        name: 'rename',
        description: 'Rename your business to a custom LLC name (Costs 🪙1,000)',
        type: 1,
        options: [
          { name: 'index', description: 'The index number of the business from /business list', type: 4, required: true },
          { name: 'name', description: 'The new custom name for your LLC', type: 3, required: true }
        ]
      },
      {
        name: 'hire',
        description: 'Offer a job to a player at your company.',
        type: 1,
        options: [
          { name: 'index', description: 'Business index', type: 4, required: true },
          { name: 'user', description: 'Player to hire', type: 6, required: true },
          { name: 'title', description: 'Job Title', type: 3, required: true },
          { name: 'salary', description: 'Hourly Salary (🪙)', type: 4, required: true }
        ]
      },
      {
        name: 'fire',
        description: 'Fire an employee from your company.',
        type: 1,
        options: [
          { name: 'user', description: 'Player to fire', type: 6, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;

    if (sub === 'buy') {
      const type = interaction.options.getString('type');
      const config = BIZ_CONFIG[type];

      const user = await User.findOne({ discordId });
      if (!user || user.wallet < config.cost) {
        return interaction.reply({ content: `You are too broke. You need 🪙**${config.cost.toLocaleString()}** to buy a ${type}.`, ephemeral: true });
      }

      await User.updateOne({ discordId }, { $inc: { wallet: -config.cost } });
      await new Business({ ownerId: discordId, type }).save();

      return interaction.reply(`📈 Congratulations! You are now the proud owner of a **${type}**! Use \`/business collect\` to claim revenue.`);
    }

    if (sub === 'list') {
      const businesses = await Business.find({ ownerId: discordId });
      if (businesses.length === 0) return interaction.reply({ content: "You own nothing. Go buy a business first.", ephemeral: true });

      let desc = `🏢 **Your Empire:**\n\n`;
      businesses.forEach((b, i) => {
        const displayName = b.customName ? `${b.customName} (${b.type})` : b.type;
        desc += `**${i+1}. ${displayName} (Lvl ${b.level})**\n`;
      });
      return interaction.reply(desc);
    }

    if (sub === 'collect') {
      const businesses = await Business.find({ ownerId: discordId });
      if (businesses.length === 0) return interaction.reply({ content: "You don't own any businesses to collect from.", ephemeral: true });

      const user = await User.findOne({ discordId });
      let hasCapitalistBuff = false;
      if (user && user.cult && user.cult !== 'None') {
        const Cult = require('../models/Cult');
        const myCult = await Cult.findOne({ name: user.cult });
        if (myCult && myCult.perk === 'Capitalists') hasCapitalistBuff = true;
      }

      let totalCollected = 0;
      let msg = `💰 **Revenue Collection Report:**\n\n`;
      const now = Date.now();

      for (const b of businesses) {
        const config = BIZ_CONFIG[b.type];
        if (now - b.lastCollected >= config.collectInterval) {
          let income = config.baseIncome * b.level;
          if (hasCapitalistBuff) income = Math.floor(income * 1.2); // +20%
          
          
          const displayName = b.customName || b.type;
          if (config.risk) {
            // Casino can lose money
            if (Math.random() > 0.6) {
              income = -Math.floor(income / 2);
              msg += `🎰 ${displayName}: **Lost** 🪙${Math.abs(income)}\n`;
            } else {
              income = Math.floor(income * 1.5);
              msg += `🎰 ${displayName}: **Jackpot!** 🪙${income}\n`;
            }
          } else {
            msg += `🏢 ${displayName}: +🪙${income}\n`;
          }

          totalCollected += income;
          b.lastCollected = now;
          await b.save();
        } else {
          const timeLeft = Math.floor((config.collectInterval - (now - b.lastCollected)) / 60000);
          msg += `⏳ ${b.type}: ${timeLeft} mins remaining.\n`;
        }
      }

      if (totalCollected !== 0) {
        await User.updateOne({ discordId }, { $inc: { wallet: totalCollected } });
      }

      return interaction.reply(msg + `\n**Net Change:** 🪙${totalCollected}`);
    }

    if (sub === 'rename') {
      const index = interaction.options.getInteger('index') - 1;
      const newName = interaction.options.getString('name');

      const user = await User.findOne({ discordId });
      if (!user || user.wallet < 1000) {
        return interaction.reply({ content: "You need 🪙1,000 to file LLC renaming paperwork.", ephemeral: true });
      }

      const businesses = await Business.find({ ownerId: discordId });
      if (index < 0 || index >= businesses.length) {
        return interaction.reply({ content: "Invalid business index. Check `/business list`.", ephemeral: true });
      }

      const b = businesses[index];
      b.customName = newName;
      await b.save();

      user.wallet -= 1000;
      await user.save();

      return interaction.reply(`📝 **LLC Registered!** Your ${b.type} is now officially named **${newName}**!`);
    }

    if (sub === 'hire') {
      const index = interaction.options.getInteger('index') - 1;
      const targetUser = interaction.options.getUser('user');
      const title = interaction.options.getString('title');
      const salary = interaction.options.getInteger('salary');

      if (salary < 1) return interaction.reply({ content: "Salary must be at least 🪙1.", ephemeral: true });

      const businesses = await Business.find({ ownerId: discordId });
      if (index < 0 || index >= businesses.length) return interaction.reply({ content: "Invalid business index.", ephemeral: true });
      
      const b = businesses[index];
      const displayName = b.customName || b.type;

      // Check if target user exists
      let targetRecord = await User.findOne({ discordId: targetUser.id });
      if (!targetRecord) return interaction.reply({ content: "That user doesn't exist in the GhostVerse.", ephemeral: true });
      if (targetRecord.employerId !== 'None' && targetRecord.employerId !== 'State') {
        return interaction.reply({ content: "They are already employed by another company.", ephemeral: true });
      }

      // To keep things simple without Buttons for now, we just force-hire them (like a draft).
      // In a full MMO, this would be an offer system.
      targetRecord.jobTitle = title;
      targetRecord.jobSalary = salary;
      targetRecord.employerId = b._id.toString();
      await targetRecord.save();

      return interaction.reply(`🤝 **YOU'RE HIRED!** <@${targetUser.id}> has been hired by **${displayName}** as a **${title}** making 🪙${salary}/hour!`);
    }

    if (sub === 'fire') {
      const targetUser = interaction.options.getUser('user');
      let targetRecord = await User.findOne({ discordId: targetUser.id });

      if (!targetRecord || targetRecord.employerId === 'None' || targetRecord.employerId === 'State') {
        return interaction.reply({ content: "They don't work for a player company.", ephemeral: true });
      }

      // Check if the caller actually owns the business they work for
      const b = await Business.findById(targetRecord.employerId);
      if (!b || b.ownerId !== discordId) {
        return interaction.reply({ content: "You do not own the company they work for!", ephemeral: true });
      }

      const oldTitle = targetRecord.jobTitle;
      const displayName = b.customName || b.type;

      targetRecord.jobTitle = 'Unemployed';
      targetRecord.jobSalary = 0;
      targetRecord.employerId = 'None';
      await targetRecord.save();

      return interaction.reply(`🥾 **YOU'RE FIRED!** <@${targetUser.id}> was fired from **${displayName}**.`);
    }
  }
};
