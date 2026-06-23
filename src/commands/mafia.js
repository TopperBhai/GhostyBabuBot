const User = require('../models/User');
const Business = require('../models/Business');

module.exports = {
  data: {
    name: 'mafia',
    description: 'Extort local businesses if you are in the Mafia.',
    options: [
      {
        name: 'extort',
        description: 'Demand protection money from a business.',
        type: 1,
        options: [
          { name: 'owner', description: 'The player who owns the business', type: 6, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    const targetUser = interaction.options.getUser('owner');

    let mafioso = await User.findOne({ discordId });
    if (!mafioso || mafioso.jobTitle !== 'Mafia Member') {
      return interaction.reply({ content: "You are not a Mafia Member! Join the Mafia first.", ephemeral: true });
    }

    if (mafioso.jailUntil && mafioso.jailUntil > new Date()) {
      return interaction.reply({ content: "You are in PRISON! You cannot extort anyone.", ephemeral: true });
    }

    if (targetUser.id === discordId) {
      return interaction.reply({ content: "You cannot extort your own businesses.", ephemeral: true });
    }

    // Cooldown check via Redis
    if (client.redis) {
      const isCooldown = await client.redis.get(`extort_cd_${discordId}`);
      if (isCooldown) {
        return interaction.reply({ content: "You need to lay low. Wait before extorting again.", ephemeral: true });
      }
      await client.redis.set(`extort_cd_${discordId}`, '1', 'EX', 1800); // 30 min cooldown
    }

    // Check if target has businesses
    const targetBizCount = await Business.countDocuments({ ownerId: targetUser.id });
    if (targetBizCount === 0) {
      return interaction.reply({ content: "That player does not own any businesses to extort.", ephemeral: true });
    }

    let targetRecord = await User.findOne({ discordId: targetUser.id });
    if (!targetRecord) return interaction.reply({ content: "Target not found in GhostVerse.", ephemeral: true });

    // Success chance 60%
    const isSuccess = Math.random() < 0.60;

    if (isSuccess) {
      // Steal 5% of their liquid wallet, capped at 100k
      const stolen = Math.min(Math.floor(targetRecord.wallet * 0.05), 100000);
      if (stolen <= 0) {
        return interaction.reply({ content: `<@${targetUser.id}> is too broke to extort. They literally have nothing.` });
      }

      mafioso.wallet += stolen;
      targetRecord.wallet -= stolen;

      await mafioso.save();
      await targetRecord.save();

      return interaction.reply(`🕵️‍♂️ **EXTORTION SUCCESS!** You threatened <@${targetUser.id}>'s businesses and forced them to pay **🪙${stolen.toLocaleString()}** in protection money!`);
    } else {
      // 40% chance the target calls the cops
      const releaseDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours jail
      mafioso.jailUntil = releaseDate;
      await mafioso.save();

      const unixRelease = Math.floor(releaseDate.getTime() / 1000);
      return interaction.reply(`🚨 **BUSTED!** <@${targetUser.id}> called the police. The SWAT team arrested you for extortion! You are in **PRISON**. Releases <t:${unixRelease}:R>.`);
    }
  }
};
