module.exports = {
  data: {
    name: 'help',
    description: 'A super simple guide to everything Ghosty Babu can do! (Baby Friendly 🍼)',
    options: []
  },
  async execute(interaction, client) {
    const embed = {
      color: 0x00FFBB, // Bright friendly color
      author: {
        name: "🍼 GhostVerse for Dummies (Super Simple Guide)",
        icon_url: client.user.displayAvatarURL()
      },
      description: "Welcome to GhostVerse! Here is the complete list of everything you can do in the city.\n\n**Free Money:** Just chat in the server or sit in a Voice Channel to passively earn Ghost Coins! 🪙",
      fields: [
        {
          name: "👤 BASIC & ECONOMY",
          value: "`profile` `inventory` `leaderboard` `bank` `pay`",
          inline: false
        },
        {
          name: "💼 JOBS & POLICE",
          value: "`job list` `job apply` `job resign` `police arrest`",
          inline: false
        },
        {
          name: "🏢 BUSINESS & MARKET",
          value: "`business buy` `business list` `business hire` `market view` `market sell` `market buy` `realestate buy`",
          inline: false
        },
        {
          name: "📈 INVESTING",
          value: "`stock view` `stock buy` `stock sell`",
          inline: false
        },
        {
          name: "😈 CRIME & UNDERWORLD",
          value: "`heist` `mafia extort` `blackmarket buy` `pardon`",
          inline: false
        },
        {
          name: "🏛️ POLITICS & WAR",
          value: "`join` `nation` `government vote` `government policy` `war declare`",
          inline: false
        },
        {
          name: "🔮 MAGIC, SOCIAL & FAMILY",
          value: "`cult found` `family propose` `family adopt` `media publish` `casino gamble` `mint` `catch`",
          inline: false
        },
        {
          name: "😂 FUN & AI CHAT",
          value: "`rizz` `flirt` `roast` `bhavishyavani`",
          inline: false
        }
      ],
      footer: { text: "Use /<command> to run them! Start with /job apply 🚀" }
    };

    return interaction.reply({ embeds: [embed] });
  }
};