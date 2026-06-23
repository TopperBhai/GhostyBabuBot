const User = require('../models/User');

const ILLEGAL_JOBS = ['Drug Dealer', 'Smuggler', 'Mafia Member', 'Assassin'];

module.exports = {
  data: {
    name: 'police',
    description: 'Enforce the law as a Police Officer.',
    options: [
      {
        name: 'arrest',
        description: 'Attempt to arrest a wanted criminal (Must be a Police Officer).',
        type: 1,
        options: [
          { name: 'criminal', description: 'The player you are trying to arrest', type: 6, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    const targetUser = interaction.options.getUser('criminal');

    if (discordId === targetUser.id) {
      return interaction.reply({ content: "You cannot arrest yourself.", ephemeral: true });
    }

    let cop = await User.findOne({ discordId });
    if (!cop || cop.jobTitle !== 'Police Officer') {
      return interaction.reply({ content: "You are not a Police Officer! You have no authority.", ephemeral: true });
    }

    if (cop.jailUntil && cop.jailUntil > new Date()) {
      return interaction.reply({ content: "You are in PRISON! You cannot arrest anyone.", ephemeral: true });
    }

    // Cooldown check via Redis
    if (client.redis) {
      const isCooldown = await client.redis.get(`arrest_cd_${discordId}`);
      if (isCooldown) {
        return interaction.reply({ content: "You are exhausted from your last patrol. Wait before attempting another arrest.", ephemeral: true });
      }
      await client.redis.set(`arrest_cd_${discordId}`, '1', 'EX', 1800); // 30 min cooldown
    }

    let suspect = await User.findOne({ discordId: targetUser.id });
    if (!suspect) {
      return interaction.reply({ content: "Suspect not found in GhostVerse.", ephemeral: true });
    }

    // Is the suspect already in jail?
    if (suspect.jailUntil && suspect.jailUntil > new Date()) {
      return interaction.reply({ content: `<@${targetUser.id}> is already in PRISON.`, ephemeral: true });
    }

    // Verify if suspect is actually a criminal
    if (!ILLEGAL_JOBS.includes(suspect.jobTitle)) {
      return interaction.reply({ content: `🚨 **CORRUPTION WARNING!** <@${targetUser.id}> is a law-abiding **${suspect.jobTitle}**. You cannot arrest innocent people!`, ephemeral: true });
    }

    // 50% chance to catch them
    const isSuccess = Math.random() < 0.50;

    if (isSuccess) {
      // 4 hours in Jail
      const releaseDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
      suspect.jailUntil = releaseDate;

      // 15% wallet fine goes to the Cop as a Bounty
      const fine = Math.floor(suspect.wallet * 0.15);
      suspect.wallet -= fine;
      cop.wallet += fine;

      await suspect.save();
      await cop.save();

      const unixRelease = Math.floor(releaseDate.getTime() / 1000);
      return interaction.reply(`🚨 **ARREST SUCCESSFUL!** Officer <@${discordId}> chased down <@${targetUser.id}> and locked them up!\n\nThe suspect has been sentenced to **PRISON** (Releases <t:${unixRelease}:R>) and was fined 🪙**${fine.toLocaleString()}**, which Officer <@${discordId}> received as a State Bounty!`);
    } else {
      return interaction.reply(`💨 **SUSPECT ESCAPED!** Officer <@${discordId}> tried to arrest <@${targetUser.id}>, but the suspect slipped away into the shadows!`);
    }
  }
};
