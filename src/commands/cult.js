
const User = require('../models/User');
const Cult = require('../models/Cult');

module.exports = {
  data: {
    name: 'cult',
    description: 'Religions of the GhostVerse.',
    options: [
      {
        name: 'found',
        description: 'Spend 🪙50,000 to found a Cult.',
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

      if (user.wallet < 50000) {
        return interaction.reply({ content: "You need 🪙50,000 Ghost Coins to found a cult.", ephemeral: true });
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

      user.wallet -= 50000;
      user.cult = name;
      await user.save();

      await new Cult({ name, founderId: discordId, perk, followers: 1 }).save();

      return interaction.reply(`🔮 **ALL HAIL!** <@${discordId}> has founded the **${name}** cult! Their followers gain the **${perk}** buff.`);
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

      return interaction.reply(`🩸 <@${discordId}> has pledged their soul to **${targetCult.name}**.`);
    }

    if (sub === 'info') {
      const name = interaction.options.getString('name');
      const targetCult = await Cult.findOne({ name: new RegExp('^' + name + '$', 'i') });
      if (!targetCult) return interaction.reply({ content: "That cult doesn't exist.", ephemeral: true });

      return interaction.reply(`🔮 **${targetCult.name}**\n👑 **Founder:** <@${targetCult.founderId}>\n👥 **Followers:** ${targetCult.followers}\n⚡ **Buff:** ${targetCult.perk}`);
    }
  }
};
