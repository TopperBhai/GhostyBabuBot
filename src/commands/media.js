const Business = require('../models/Business');

module.exports = {
  data: {
    name: 'media',
    description: 'Control the media narrative if you own a Media Company.',
    options: [
      {
        name: 'publish',
        description: 'Publish a global headline to all servers.',
        type: 1,
        options: [
          { name: 'headline', description: 'The news headline to broadcast', type: 3, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    
    // Check if they own a media company
    const mediaBiz = await Business.findOne({ ownerId: discordId, type: 'Media Company' });
    if (!mediaBiz) {
      return interaction.reply({ content: "You do not own a Media Company! You cannot publish news.", ephemeral: true });
    }

    const headline = interaction.options.getString('headline');
    const companyName = mediaBiz.customName || 'A GhostVerse Media Corp';

    const embed = {
      color: 0xFF0000,
      title: `📰 BREAKING NEWS from ${companyName}`,
      description: `**"${headline}"**`,
      footer: { text: `Published by CEO ${interaction.user.username}` },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ content: "📰 **GLOBAL BROADCAST INITIATED**", embeds: [embed] });
  }
};
