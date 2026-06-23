const User = require('../models/User');

module.exports = {
  data: {
    name: 'bank',
    description: 'Manage your Central Bank account.',
    options: [
      {
        name: 'deposit',
        description: 'Deposit money into your bank to keep it safe from robbers/extortion.',
        type: 1,
        options: [
          { name: 'amount', description: 'Amount to deposit', type: 4, required: true }
        ]
      },
      {
        name: 'withdraw',
        description: 'Withdraw money from your bank into your wallet.',
        type: 1,
        options: [
          { name: 'amount', description: 'Amount to withdraw', type: 4, required: true }
        ]
      },
      {
        name: 'balance',
        description: 'Check your bank balance.',
        type: 1
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;
    
    let user = await User.findOne({ discordId });
    if (!user) user = await new User({ discordId }).save();

    if (sub === 'balance') {
      return interaction.reply({ content: `🏦 **Central Bank**\n**Wallet:** 🪙${user.wallet.toLocaleString()}\n**Bank Balance:** 🪙${(user.bank || 0).toLocaleString()}`, ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: "Amount must be at least 🪙1.", ephemeral: true });

    if (sub === 'deposit') {
      if (user.wallet < amount) {
        return interaction.reply({ content: `You only have 🪙${user.wallet.toLocaleString()} in your wallet.`, ephemeral: true });
      }
      user.wallet -= amount;
      user.bank = (user.bank || 0) + amount;
      await user.save();
      return interaction.reply(`🏦 You deposited 🪙${amount.toLocaleString()} into your bank. It is now safe from the Mafia.`);
    }

    if (sub === 'withdraw') {
      if ((user.bank || 0) < amount) {
        return interaction.reply({ content: `You only have 🪙${(user.bank || 0).toLocaleString()} in your bank.`, ephemeral: true });
      }
      user.bank -= amount;
      user.wallet += amount;
      await user.save();
      return interaction.reply(`💸 You withdrew 🪙${amount.toLocaleString()} into your wallet.`);
    }
  }
};
