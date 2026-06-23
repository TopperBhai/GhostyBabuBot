
const Nation = require('../models/Nation');

module.exports = {
  data: {
    name: 'nation',
    description: 'View the statistics of a specific Nation.',
    options: [
      {
        name: 'name',
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
    const nationName = interaction.options.getString('name');
    const n = await Nation.findOne({ name: nationName });
    
    if (!n) return interaction.reply({ content: "Nation data corrupted.", ephemeral: true });

    let leaderMention = n.leaderId ? `<@${n.leaderId}>` : 'No Leader (Election Pending)';

    const embed = {
      color: 0x992d22,
      title: `🗺️ ${n.name}`,
      fields: [
        { name: 'Leader', value: leaderMention, inline: true },
        { name: 'Population', value: `👥 ${n.population}`, inline: true },
        { name: 'Treasury', value: `🪙 ${n.treasury.toLocaleString()}`, inline: true },
        { name: 'GDP', value: `📈 ${n.gdp.toLocaleString()}`, inline: true },
        { name: 'Power Score', value: `⚔️ ${n.powerScore}`, inline: true },
      ]
    };

    await interaction.reply({ embeds: [embed] });
  }
};
