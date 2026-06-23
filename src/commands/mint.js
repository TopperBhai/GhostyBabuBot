
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

    return interaction.reply(`✨ **DIVINE FORGE!**\n<@${discordId}> has spent 🪙1,000,000 to forge the Custom Artifact: **${emoji} ${name}**!`);
  }
};
