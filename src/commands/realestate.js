const User = require('../models/User');
const Property = require('../models/Property');
const State = require('../models/State');

const PROPERTY_TYPES = {
  'Apartment': { price: 5000, rent: 100, collectInterval: 3600000 }, // 1 hour
  'Mansion': { price: 50000, rent: 1500, collectInterval: 14400000 }, // 4 hours
  'Office Building': { price: 200000, rent: 8000, collectInterval: 28800000 }, // 8 hours
  'Penthouse': { price: 1000000, rent: 50000, collectInterval: 86400000 } // 24 hours
};

module.exports = {
  data: {
    name: 'realestate',
    description: 'GhostVerse Real Estate Market.',
    options: [
      {
        name: 'market',
        description: 'View properties available for purchase.',
        type: 1
      },
      {
        name: 'buy',
        description: 'Buy a property.',
        type: 1,
        options: [
          {
            name: 'type',
            description: 'Property type to buy',
            type: 3,
            required: true,
            choices: Object.keys(PROPERTY_TYPES).map(t => ({ name: t, value: t }))
          }
        ]
      },
      {
        name: 'portfolio',
        description: 'View your real estate portfolio.',
        type: 1
      },
      {
        name: 'collect',
        description: 'Collect rent from your tenants.',
        type: 1
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });

    if (!user) return interaction.reply({ content: "You don't exist in the GhostVerse.", ephemeral: true });

    if (sub === 'market') {
      let msg = "🏙️ **GhostVerse Real Estate Market** 🏙️\n\n";
      for (const [type, config] of Object.entries(PROPERTY_TYPES)) {
        msg += `**${type}**\nPrice: 🪙${config.price.toLocaleString()}\nRent: 🪙${config.rent.toLocaleString()} every ${config.collectInterval / 3600000}h\n\n`;
      }
      return interaction.reply({ content: msg });
    }

    if (sub === 'buy') {
      const type = interaction.options.getString('type');
      const config = PROPERTY_TYPES[type];

      if (user.wallet < config.price) {
        return interaction.reply({ content: `You need 🪙${config.price.toLocaleString()} to buy a ${type}.`, ephemeral: true });
      }

      user.wallet -= config.price;
      await user.save();

      await new Property({
        ownerId: discordId,
        type: type,
        value: config.price,
        baseRent: config.rent,
        lastCollected: Date.now()
      }).save();

      return interaction.reply(`🗝️ **DEAL CLOSED!** <@${discordId}> just purchased a **${type}** for 🪙${config.price.toLocaleString()}!`);
    }

    if (sub === 'portfolio') {
      const properties = await Property.find({ ownerId: discordId });
      if (properties.length === 0) return interaction.reply({ content: "You don't own any real estate.", ephemeral: true });

      let msg = `🏠 **<@${discordId}>'s Real Estate Portfolio:**\n\n`;
      let totalValue = 0;
      properties.forEach((p, i) => {
        msg += `**${i+1}. ${p.type}** (Value: 🪙${p.value.toLocaleString()})\n`;
        totalValue += p.value;
      });
      msg += `\n**Total Real Estate Value:** 🪙${totalValue.toLocaleString()}`;
      return interaction.reply({ content: msg });
    }

    if (sub === 'collect') {
      const properties = await Property.find({ ownerId: discordId });
      if (properties.length === 0) return interaction.reply({ content: "You don't own any properties to collect rent from.", ephemeral: true });

      let totalCollected = 0;
      const now = Date.now();
      let msg = "💸 **Rent Collection Report:**\n\n";

      for (const p of properties) {
        const config = PROPERTY_TYPES[p.type];
        if (now - p.lastCollected >= config.collectInterval) {
          totalCollected += p.baseRent;
          p.lastCollected = now;
          await p.save();
          msg += `+ 🪙${p.baseRent.toLocaleString()} from **${p.type}**\n`;
        } else {
          const timeLeft = Math.ceil((config.collectInterval - (now - p.lastCollected)) / 60000);
          msg += `⏳ **${p.type}**: Tenants will pay rent in ${timeLeft} minutes.\n`;
        }
      }

      if (totalCollected > 0) {
        let state = await State.findOne({ id: 'GLOBAL' });
        if (!state) state = await new State({ id: 'GLOBAL' }).save();

        const taxRate = state.taxRate || 0.10;
        const taxesDue = Math.floor(totalCollected * taxRate);
        const netIncome = totalCollected - taxesDue;

        state.treasury += taxesDue;
        await state.save();

        user.wallet += netIncome;
        await user.save();
        msg += `\n**Total Rent Collected:** 🪙${totalCollected.toLocaleString()}\n**Federal Income Tax (${(taxRate*100).toFixed(0)}%):** -🪙${taxesDue.toLocaleString()}\n**Net Income:** 🪙${netIncome.toLocaleString()}`;
      } else {
        msg += `\n*No rent is due yet.*`;
      }

      return interaction.reply({ content: msg });
    }
  }
};
