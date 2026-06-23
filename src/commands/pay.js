const User = require('../models/User');
const State = require('../models/State');

module.exports = {
  data: {
    name: 'pay',
    description: 'Wire transfer Ghost Coins to another player (5% State Tax).',
    options: [
      {
        name: 'user',
        description: 'The player you want to send money to',
        type: 6,
        required: true
      },
      {
        name: 'amount',
        description: 'Amount of Ghost Coins to send',
        type: 4,
        required: true
      }
    ]
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (discordId === targetUser.id) {
      return interaction.reply({ content: "You cannot pay yourself.", ephemeral: true });
    }

    if (amount < 10) {
      return interaction.reply({ content: "Minimum transfer amount is 🪙10.", ephemeral: true });
    }

    let sender = await User.findOne({ discordId });
    if (!sender) return interaction.reply({ content: "You do not exist in the GhostVerse.", ephemeral: true });

    if (sender.jailUntil && sender.jailUntil > new Date()) {
      return interaction.reply({ content: "You are in PRISON! You cannot wire money.", ephemeral: true });
    }

    if (sender.wallet < amount) {
      return interaction.reply({ content: `You do not have enough money. Your wallet: 🪙${sender.wallet}`, ephemeral: true });
    }

    let receiver = await User.findOne({ discordId: targetUser.id });
    if (!receiver) return interaction.reply({ content: "The recipient does not exist in the GhostVerse.", ephemeral: true });

    if (receiver.jailUntil && receiver.jailUntil > new Date()) {
      return interaction.reply({ content: "The recipient's bank accounts are frozen because they are in PRISON.", ephemeral: true });
    }

    // Daily Limit Check via Redis (50,000 max)
    let dailyKey = "";
    let currentTransferred = 0;
    
    if (client.redis) {
      // Create a key unique to the user and the current day (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      dailyKey = `daily_pay_${discordId}_${today}`;
      const val = await client.redis.get(dailyKey);
      if (val) currentTransferred = parseInt(val, 10);

      if (currentTransferred + amount > 50000) {
        const remaining = 50000 - currentTransferred;
        return interaction.reply({ content: `You have hit your daily wire transfer limit. You can only send 🪙${remaining} more today.`, ephemeral: true });
      }
    }

    // 5% State Tax
    const tax = Math.ceil(amount * 0.05);
    const finalAmount = amount - tax;

    sender.wallet -= amount;
    receiver.wallet += finalAmount;

    await sender.save();
    await receiver.save();

    // Update Global Treasury
    let state = await State.findOne({ id: 'GLOBAL' });
    if (!state) state = new State({ id: 'GLOBAL' });
    state.treasury += tax;
    await state.save();

    // Update Redis Daily Limit
    if (client.redis && dailyKey) {
      await client.redis.incrby(dailyKey, amount);
      // Set expiration to 24 hours if it doesn't exist
      const ttl = await client.redis.ttl(dailyKey);
      if (ttl === -1) {
        await client.redis.expire(dailyKey, 86400); // 24 hours
      }
    }

    const embed = {
      color: 0x00ff00,
      title: "💸 Wire Transfer Successful",
      description: `**From:** <@${discordId}>\n**To:** <@${targetUser.id}>\n\n**Amount Sent:** 🪙${amount.toLocaleString()}\n**State Tax (5%):** 🪙${tax.toLocaleString()}\n**Received:** 🪙${finalAmount.toLocaleString()}`,
      footer: { text: "GhostVerse Federal Reserve" },
      timestamp: new Date().toISOString()
    };

    return interaction.reply({ embeds: [embed] });
  }
};
