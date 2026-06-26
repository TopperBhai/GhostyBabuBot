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
      description: "Welcome to GhostVerse! Our economy is realistic & challenging. Follow this roadmap to go from broke to billionaire:\n\n" +
                   "🔰 **STARTER ROADMAP (How to get rich):**\n" +
                   "1️⃣ Run `/daily` (stipend) & `/work` (odd jobs) for quick starter cash.\n" +
                   "2️⃣ Get a steady salaried job (`/job list` -> `/job apply`).\n" +
                   "3️⃣ Buy real estate (`/realestate buy`) for passive daily rent.\n" +
                   "4️⃣ Launch your own company (`/business buy`) & invest in Wall St (`/stock buy`).\n\n" +
                   "💬 **Passive Income:** You also earn 🪙1 coin every 5 mins actively chatting or sitting in VC!",
      fields: [
        {
          name: "⚡ QUICK CASH (STARTER COMMANDS)",
          value: "`daily` `work`",
          inline: false
        },
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
          value: "`cult found` `family propose` `family adopt` `media publish` `casino gamble` `mint`",
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