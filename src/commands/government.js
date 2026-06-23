const State = require('../models/State');
const User = require('../models/User');

module.exports = {
  data: {
    name: 'government',
    description: 'GhostVerse Federal Government',
    options: [
      {
        name: 'treasury',
        description: 'View the Federal Treasury, Tax Rate, and current President.',
        type: 1
      },
      {
        name: 'vote',
        description: 'Cast your vote for President.',
        type: 1,
        options: [
          { name: 'candidate', description: 'The player you want to be President.', type: 6, required: true }
        ]
      },
      {
        name: 'policy',
        description: '[PRESIDENT ONLY] Change the Federal Tax Rate.',
        type: 1,
        options: [
          { name: 'tax_rate', description: 'New tax rate percentage (0 to 50)', type: 4, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;

    // Ensure state exists
    let state = await State.findOne({ id: 'GLOBAL' });
    if (!state) {
      state = await new State({ id: 'GLOBAL' }).save();
    }

    if (sub === 'treasury') {
      const presStr = state.presidentId === 'None' ? 'No President' : `<@${state.presidentId}>`;
      
      const embed = {
        color: 0x00FF00,
        title: "🏛️ Federal Government of GhostVerse",
        fields: [
          { name: "Current President", value: presStr, inline: false },
          { name: "Treasury Balance", value: `🪙${state.treasury.toLocaleString()}`, inline: true },
          { name: "Income Tax Rate", value: `${(state.taxRate * 100).toFixed(0)}%`, inline: true }
        ],
        footer: { text: "Use /government vote to overthrow the government." }
      };

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'vote') {
      const candidate = interaction.options.getUser('candidate');
      
      let voterRecord = await User.findOne({ discordId });
      if (!voterRecord) return interaction.reply({ content: "You do not exist in the database.", ephemeral: true });

      let candidateRecord = await User.findOne({ discordId: candidate.id });
      if (!candidateRecord) return interaction.reply({ content: "That candidate does not exist.", ephemeral: true });

      // Remove old vote
      if (voterRecord.votedFor !== 'None') {
        let oldCandidate = await User.findOne({ discordId: voterRecord.votedFor });
        if (oldCandidate) {
          oldCandidate.votesReceived = Math.max(0, oldCandidate.votesReceived - 1);
          await oldCandidate.save();
        }
      }

      // Cast new vote
      voterRecord.votedFor = candidate.id;
      candidateRecord.votesReceived += 1;
      await voterRecord.save();
      await candidateRecord.save();

      // Check for new President (Continuous Election Logic)
      // Find the player with the most votes
      const topCandidate = await User.findOne().sort({ votesReceived: -1 });
      
      let presChangeMsg = "";
      if (topCandidate && topCandidate.votesReceived > 0 && state.presidentId !== topCandidate.discordId) {
        state.presidentId = topCandidate.discordId;
        await state.save();
        presChangeMsg = `\n\n🚨 **BREAKING NEWS!** <@${topCandidate.discordId}> has secured the majority and has been sworn in as the new **President of GhostVerse**!`;
      }

      return interaction.reply(`🗳️ You cast your ballot for <@${candidate.id}>! They now have **${candidateRecord.votesReceived}** votes.` + presChangeMsg);
    }

    if (sub === 'policy') {
      if (state.presidentId !== discordId) {
        return interaction.reply({ content: "You are not the President! Only the President can change the tax rate.", ephemeral: true });
      }

      const newRate = interaction.options.getInteger('tax_rate');
      if (newRate < 0 || newRate > 50) {
        return interaction.reply({ content: "Tax rate must be between 0% and 50%.", ephemeral: true });
      }

      state.taxRate = newRate / 100;
      await state.save();

      return interaction.reply(`📜 **EXECUTIVE ORDER:** President <@${discordId}> has signed a new tax bill! The Federal Tax Rate is now **${newRate}%**!`);
    }
  }
};
