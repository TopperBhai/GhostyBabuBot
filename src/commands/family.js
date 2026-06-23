const User = require('../models/User');

module.exports = {
  data: {
    name: 'family',
    description: 'Manage your GhostVerse dynasty and legacy.',
    options: [
      {
        name: 'propose',
        description: 'Propose marriage to another player.',
        type: 1,
        options: [
          { name: 'user', description: 'The player to marry', type: 6, required: true }
        ]
      },
      {
        name: 'adopt',
        description: 'Adopt a child into your family.',
        type: 1,
        options: [
          { name: 'user', description: 'The player to adopt', type: 6, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    // Basic RP implementation for the family system to establish the legacy links
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;
    const targetUser = interaction.options.getUser('user');

    if (discordId === targetUser.id) {
      return interaction.reply({ content: "You cannot do that to yourself.", ephemeral: true });
    }

    let user = await User.findOne({ discordId });
    if (!user) return interaction.reply({ content: "You don't exist.", ephemeral: true });

    if (sub === 'propose') {
      return interaction.reply(`💍 <@${discordId}> got down on one knee and proposed to <@${targetUser.id}>!\n*(They must say "yes" in chat!)*`);
    }

    if (sub === 'adopt') {
      return interaction.reply(`🍼 <@${discordId}> has signed the adoption papers for <@${targetUser.id}>! They are now officially your child and heir to your GhostVerse Empire!`);
    }
  }
};
