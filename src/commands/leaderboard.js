
const User = require('../models/User');
const Nation = require('../models/Nation');
const Cult = require('../models/Cult');

module.exports = {
  data: {
    name: 'leaderboard',
    description: 'View the GhostVerse Global Leaderboards.',
    options: []
  },
  async execute(interaction, client) {
    const topUsers = await User.find().sort({ wallet: -1 }).limit(3);
    const topNations = await Nation.find().sort({ powerScore: -1 }).limit(3);
    const topCults = await Cult.find().sort({ followers: -1 }).limit(3);

    let uStr = topUsers.map((u, i) => `**${i+1}.** <@${u.discordId}> - 🪙${u.wallet.toLocaleString()}`).join('\n') || "None";
    let nStr = topNations.map((n, i) => `**${i+1}.** ${n.name} - ⚔️${Math.floor(n.powerScore)}`).join('\n') || "None";
    let cStr = topCults.map((c, i) => `**${i+1}.** ${c.name} - 👥${c.followers}`).join('\n') || "None";

    const embed = {
      color: 0xffd700,
      title: "🏆 GhostVerse Global Leaderboards",
      fields: [
        { name: "💰 Richest Citizens", value: uStr },
        { name: "🗺️ Strongest Nations", value: nStr },
        { name: "🔮 Largest Cults", value: cStr }
      ]
    };

    return interaction.reply({ embeds: [embed] });
  }
};
