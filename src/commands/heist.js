
const User = require('../models/User');

module.exports = {
  data: {
    name: 'heist',
    description: 'Rob the central bank. High risk, high reward. Failure means PRISON.',
    options: []
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });

    if (!user) return interaction.reply({ content: "You don't exist yet.", ephemeral: true });

    // Check if Jailed
    if (user.jailUntil && user.jailUntil > new Date()) {
      return interaction.reply({ content: `You are in PRISON until ${user.jailUntil.toLocaleString()}. Use /blackmarket or bribe someone to get out.`, ephemeral: true });
    }

    // Cooldown check via Redis
    if (client.redis) {
      const isCooldown = await client.redis.get(`heist_cd_${discordId}`);
      if (isCooldown) {
        return interaction.reply({ content: "The cops are still looking for you. Wait before doing another heist.", ephemeral: true });
      }
      await client.redis.set(`heist_cd_${discordId}`, '1', 'EX', 3600); // 1 hour cooldown
    }

    let successChance = 0.3; // 30% base chance

    // Check inventory for Sabotage Kit
    const hasKitIndex = user.inventory.findIndex(i => i.type === 'Sabotage Kit');
    if (hasKitIndex !== -1) {
      successChance += 0.2; // 50% chance with kit
      user.inventory.splice(hasKitIndex, 1); // Consume item
      user.markModified('inventory');
    }

    const isSuccess = Math.random() < successChance;

    if (isSuccess) {
      const loot = Math.floor(Math.random() * 50000) + 10000; // 10k-60k
      user.wallet += loot;
      await user.save();
      return interaction.reply(`🔫 **HEIST SUCCESSFUL!** You hacked the mainframe and stole 🪙**${loot.toLocaleString()}**. The police are clueless.`);
    } else {
      // PRISON TIME! (6 hours)
      const releaseDate = new Date(Date.now() + 6 * 60 * 60 * 1000);
      user.jailUntil = releaseDate;
      
      // Fine them 10% of their net worth
      const fine = Math.floor(user.wallet * 0.10);
      user.wallet -= fine;

      await user.save();
      return interaction.reply(`🚨 **BUSTED!** The SWAT team breached the bank. You lost 🪙**${fine.toLocaleString()}** and have been sentenced to **PRISON** until ${releaseDate.toLocaleString()}.`);
    }
  }
};
