
const User = require('../models/User');

const BM_ITEMS = {
  'Sabotage Kit': { cost: 500, desc: 'Increases heist success chance by 20% (Consumable)' },
  'Fake Passport': { cost: 1500, desc: 'Instantly clears your prison sentence (Consumable)' }
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
            choices: Object.keys(BM_ITEMS).map(k => ({ name: k + ` (🪙${BM_ITEMS[k].cost})`, value: k }))
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
        return interaction.reply({ content: `You don't have enough Ghost Coins. You need 🪙${itemConfig.cost}.`, ephemeral: true });
      }

      user.wallet -= itemConfig.cost;
      user.inventory.push({ type: itemName, boughtAt: Date.now() });
      user.markModified('inventory');
      await user.save();

      return interaction.reply({ content: `🕵️ You secretly purchased a **${itemName}**. Watch your back.`, ephemeral: true });
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

      return interaction.reply(`🚁 **PRISON BREAK!** <@${discordId}> used a Fake Passport and escaped from GhostVerse Penitentiary!`);
    }
  }
};
