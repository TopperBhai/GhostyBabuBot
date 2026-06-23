module.exports = {
  data: {
    name: 'help',
    description: 'See all the things Ghosty Babu can do.',
    options: []
  },
  async execute(interaction, client) {
    const embed = {
      color: 0x992d22,
      title: "👻 GhostVerse Official Guide",
      description: "Welcome to the living, breathing economy of the GhostVerse. Earn coins by **chatting** or sitting in **Voice Channels**.",
      fields: [
        {
          name: "🎉 General & Fun",
          value: "`/rizz`, `/flirt`, `/roast`, `/bhavishyavani`\n`/catch` (Catch rare ghosts when they spawn!)\n`/inventory` (View your ghosts)"
        },
        {
          name: "🌍 Nations & Profiles",
          value: "`/profile` - View your Net Worth, Nation, Cult, and Artifacts.\n`/join` - Pledge allegiance to a Nation.\n`/nation` - View a Nation's live stats.\n`/leaderboard` - See the top players, nations, and cults."
        },
        {
          name: "dY', Capitalism & Economy",
          value: "`/job list|apply|quit` - Get a job and earn hourly salary.\n`/business buy|collect|inventory` - Build Farms, Factories, etc.\n`/realestate view|buy|collect` - Buy apartments and mansions for rent.\n`/market view|buy|sell` - Trade commodities on the global market.\n`/stock view|buy|sell` - Invest in the volatile Stock Market."
        },
        {
          name: "🏛️ Federal Government",
          value: "`/government treasury` - View the State Treasury and Tax Rates.\n`/government vote` - Vote for President.\n`/government policy` - (President Only) Set the tax rate."
        },
        {
          name: "dY?'??~,? The Underworld",
          value: "`/heist` - Rob the bank for huge payouts (Failure means PRISON).\n`/blackmarket buy` - Purchase illegal tools and Fake Passports.\n`/war declare` - Attack rival Nations to steal 10% of their treasury!"
        },
        {
          name: "👑 God Mode",
          value: "`/cult found|join|info` - Start a religion to give your followers passive buffs.\n`/mint` - Spend 🪙1M to forge a Custom Artifact for your profile."
        }
      ],
      footer: { text: "Survive. Thrive. Conquer." }
    };

    return interaction.reply({ embeds: [embed] });
  }
};