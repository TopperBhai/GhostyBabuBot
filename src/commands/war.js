
const User = require('../models/User');
const Nation = require('../models/Nation');

module.exports = {
  data: {
    name: 'war',
    description: 'Declare war on another nation. High stakes.',
    options: [
      {
        name: 'declare',
        description: 'Declare war on a rival nation',
        type: 1,
        options: [
          {
            name: 'target',
            description: 'The nation to attack',
            type: 3,
            required: true,
            choices: [
              { name: 'Shadow Empire', value: 'Shadow Empire' },
              { name: 'Frost Union', value: 'Frost Union' },
              { name: 'Crimson Kingdom', value: 'Crimson Kingdom' },
              { name: 'Neon Republic', value: 'Neon Republic' },
              { name: 'Lost Souls', value: 'Lost Souls' }
            ]
          }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const discordId = interaction.user.id;
    const user = await User.findOne({ discordId });

    if (!user || user.nation === 'None') {
      return interaction.reply({ content: "You don't belong to a nation.", ephemeral: true });
    }

    const attackerNationName = user.nation;
    const targetNationName = interaction.options.getString('target');

    if (attackerNationName === targetNationName) {
      return interaction.reply({ content: "You can't declare war on your own nation!", ephemeral: true });
    }

    const attacker = await Nation.findOne({ name: attackerNationName });
    const defender = await Nation.findOne({ name: targetNationName });

    if (!attacker || !defender) return interaction.reply({ content: "Nation data missing.", ephemeral: true });

    // Cooldown
    if (client.redis) {
      const cd = await client.redis.get(`war_cd_${attackerNationName}`);
      if (cd) return interaction.reply({ content: `Your nation is recovering. Wait before attacking again.`, ephemeral: true });
      await client.redis.set(`war_cd_${attackerNationName}`, '1', 'EX', 24 * 3600); // 24 hours
    }

    // Battle Math
    const attackPower = attacker.powerScore + (Math.random() * 50);
    const defensePower = defender.powerScore + (Math.random() * 50);

    await interaction.reply(`⚔️ **WAR DECLARED!**\n<@${discordId}> has ordered the **${attackerNationName}** to attack the **${targetNationName}**!\n\n*Calculating casualties...*`);

    setTimeout(async () => {
      if (attackPower > defensePower) {
        // Attacker wins! Steals 10% of treasury
        const loot = Math.floor(defender.treasury * 0.10);
        attacker.treasury += loot;
        defender.treasury -= loot;
        
        attacker.powerScore += 5;
        defender.powerScore -= 5;

        await attacker.save();
        await defender.save();

        interaction.channel.send(`🏆 **VICTORY!** The **${attackerNationName}** crushed the **${targetNationName}** and looted 🪙**${loot.toLocaleString()}** Ghost Coins!`);
      } else {
        // Defender wins! Attacker loses 10% to defender
        const penalty = Math.floor(attacker.treasury * 0.10);
        attacker.treasury -= penalty;
        defender.treasury += penalty;

        attacker.powerScore -= 5;
        defender.powerScore += 5;

        await attacker.save();
        await defender.save();

        interaction.channel.send(`🛡️ **DEFENSE SUCCESS!** The **${targetNationName}** repelled the attack! They seized 🪙**${penalty.toLocaleString()}** from the fleeing **${attackerNationName}** soldiers!`);
      }
    }, 5000); // 5 seconds drama suspense
  }
};
