
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
      return interaction.reply({ content: `You are already a citizen of the **${user.nation}**. Treason is punishable by death.`, ephemeral: true });
    }

    user.nation = nationName;
    await user.save();

    await Nation.updateOne({ name: nationName }, { $inc: { population: 1 } });

    await interaction.reply(`⚔️ <@${discordId}> has pledged their allegiance to the **${nationName}**! Welcome to the ranks, Citizen.`);
  }
};
