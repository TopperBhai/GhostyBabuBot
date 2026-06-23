module.exports = {
  data: {
    name: 'help',
    description: 'See all the things Ghosty Babu can do.',
    options: []
  },
  async execute(interaction, client) {
    const helpMsg = "👻 **Ghosty Babu Help Menu** 👻\n\n" +
    "**Commands:**\n" +
    "`/rizz <user>` - Rizz someone up in Hinglish\n" +
    "`/flirt <user>` - Flirt with someone in Hinglish\n" +
    "`/roast <user>` - Brutally roast someone in Hinglish\n" +
    "`/bhavishyavani <question>` - Get a scammy prediction for your future\n" +
    "`/catch` - Catch a Lost Spirit when it randomly spawns in the server\n" +
    "`/inventory` - View your rare ghost collection\n" +
    "`/help` - Show this menu\n\n" +
    "**🚀 COMING SOON: GHOSTVERSE**\n" +
    "• **Nations & Wars**: Join a nation, elect leaders, declare wars, and conquer!\n" +
    "• **Player Economy**: Buy businesses, invest in stocks, and become a billionaire.\n" +
    "• **Underworld**: Plan heists, trade on the Black Market, and bribe your way out of Prison.\n" +
    "• **GhostLeaks**: Anonymous rumors and newspaper articles detailing the server's juicy drama.\n\n" +
    "*Prepare yourself. The world is about to change.* ";
  return interaction.reply({ content: helpMsg, ephemeral: false });
  }
};