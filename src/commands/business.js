
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
        desc += `**${i+1}. ${b.type} (Lvl ${b.level})**\n`;
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
          
          
          if (config.risk) {
            // Casino can lose money
            if (Math.random() > 0.6) {
              income = -Math.floor(income / 2);
              msg += `🎰 ${b.type}: **Lost** 🪙${Math.abs(income)}\n`;
            } else {
              income = Math.floor(income * 1.5);
              msg += `🎰 ${b.type}: **Jackpot!** 🪙${income}\n`;
            }
          } else {
            msg += `🏢 ${b.type}: +🪙${income}\n`;
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
  }
};
