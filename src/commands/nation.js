
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
          { name: 'Kaleshi Kingdom 🐍', value: 'Kaleshi Kingdom' },
          { name: 'Pookie Cult 🎀', value: 'Pookie Cult' },
          { name: 'Nalle Berozgar 🛋️', value: 'Nalle Berozgar' },
          { name: 'VIP Backbenchers 🎒', value: 'VIP Backbenchers' },
          { name: 'Badmosh Syndicate 😈', value: 'Badmosh Syndicate' }
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
