const User = require('../models/User');
const Business = require('../models/Business');

const BIZ_CONFIG = {
  'Farm': { cost: 5000, type: 'Producer' },
  'Mine': { cost: 10000, type: 'Producer' },
  'Factory': { cost: 50000, type: 'Manufacturer' },
  'Restaurant': { cost: 75000, type: 'Manufacturer' },
  'Casino': { cost: 250000, type: 'Entertainment' },
  'Media Company': { cost: 500000, type: 'Influence' }
};

module.exports = {
  data: {
    name: 'business',
    description: 'Capitalism awaits. Buy, upgrade, and manage your businesses.',
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
            choices: [
              { name: 'Farm (🪙5000)', value: 'Farm' },
              { name: 'Mine (🪙10000)', value: 'Mine' },
              { name: 'Factory (🪙50000)', value: 'Factory' },
              { name: 'Restaurant (🪙75000)', value: 'Restaurant' },
              { name: 'Casino (🪙250000)', value: 'Casino' },
              { name: 'Media Company (🪙500000)', value: 'Media Company' }
            ]
          }
        ]
      },
      {
        name: 'inventory',
        description: 'View the inventory of your businesses',
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

      return interaction.reply(`📈 Congratulations! You are now the proud owner of a **${type}**! Use \`/market sell\` to sell goods it produces.`);
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

    if (sub === 'inventory') {
      const businesses = await Business.find({ ownerId: discordId });
      if (businesses.length === 0) return interaction.reply({ content: "You don't own any businesses.", ephemeral: true });

      let msg = `📦 **Corporate Inventory Report:**\n\n`;

      businesses.forEach((b, i) => {
        const displayName = b.customName || b.type;
        msg += `**${i+1}. ${displayName}**\n`;
        
        let invStr = "";
        if (b.inventory) {
          for (const [item, count] of Object.entries(b.inventory)) {
            invStr += `- ${item}: ${count}\n`;
          }
        }
        if (invStr === "") invStr = "- Empty\n";
        msg += invStr + "\n";
      });

      return interaction.reply({ content: msg });
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

      const b = await Business.findById(targetRecord.employerId);
      if (!b || b.ownerId !== discordId) {
        return interaction.reply({ content: "You do not own the company they work for!", ephemeral: true });
      }

      const displayName = b.customName || b.type;

      targetRecord.jobTitle = 'Unemployed';
      targetRecord.jobSalary = 0;
      targetRecord.employerId = 'None';
      await targetRecord.save();

      return interaction.reply(`🥾 **YOU'RE FIRED!** <@${targetUser.id}> was fired from **${displayName}**.`);
    }
  }
};
