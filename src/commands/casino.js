const User = require('../models/User');
const Business = require('../models/Business');

module.exports = {
  data: {
    name: 'casino',
    description: 'Gamble your money at player-owned Casinos.',
    options: [
      {
        name: 'gamble',
        description: 'Play Roulette against a Player Casino.',
        type: 1,
        options: [
          { name: 'amount', description: 'Amount of coins to bet', type: 4, required: true },
          { name: 'casino', description: 'The player owner of the casino', type: 6, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    const bet = interaction.options.getInteger('amount');
    const targetOwner = interaction.options.getUser('casino');

    if (bet <= 0) return interaction.reply({ content: "You must bet at least 🪙1.", ephemeral: true });

    let player = await User.findOne({ discordId });
    if (!player || player.wallet < bet) {
      return interaction.reply({ content: `You do not have 🪙${bet.toLocaleString()} to gamble.`, ephemeral: true });
    }

    // Find the casino business
    const casinoBiz = await Business.findOne({ ownerId: targetOwner.id, type: 'Casino' });
    if (!casinoBiz) {
      return interaction.reply({ content: `<@${targetOwner.id}> does not own a Casino.`, ephemeral: true });
    }

    let owner = await User.findOne({ discordId: targetOwner.id });
    if (!owner) return interaction.reply({ content: "Casino owner not found.", ephemeral: true });

    // Ensure the Casino has liquidity to pay out a potential win (1.5x payout)
    const potentialPayout = bet * 2; 
    if (owner.wallet < potentialPayout) {
      return interaction.reply({ content: `The Casino is too poor to accept this bet. The owner needs at least 🪙${potentialPayout.toLocaleString()} in liquidity.`, ephemeral: true });
    }

    // Gamble Logic (45% win chance for player, 55% for House)
    const win = Math.random() < 0.45;

    if (win) {
      const winnings = bet; // They get their bet back + 1x bet
      player.wallet += winnings;
      owner.wallet -= winnings; // Casino loses money
      await player.save();
      await owner.save();
      return interaction.reply(`🎰 **JACKPOT!** You bet 🪙${bet.toLocaleString()} and won!\nThe Casino owner <@${owner.discordId}> paid you 🪙${winnings.toLocaleString()}.`);
    } else {
      player.wallet -= bet;
      owner.wallet += bet; // Casino makes money
      await player.save();
      await owner.save();
      return interaction.reply(`🎲 **BUST!** You lost 🪙${bet.toLocaleString()}.\nThe Casino owner <@${owner.discordId}> gladly took your money.`);
    }
  }
};
