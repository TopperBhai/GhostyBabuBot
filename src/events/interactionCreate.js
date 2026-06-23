const User = require('../models/User');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // PRISON LOCKOUT CHECK
    const restrictedCommands = ['business', 'stock', 'heist'];
    let userRecord = await User.findOne({ discordId: interaction.user.id });
    
    if (restrictedCommands.includes(interaction.commandName)) {
      if (userRecord && userRecord.jailUntil && userRecord.jailUntil > new Date()) {
        if (interaction.commandName !== 'heist') { // heist has its own custom message for bribes
          return interaction.reply({ content: `🚨 **ACCESS DENIED.** You are serving a Prison sentence until <t:${Math.floor(userRecord.jailUntil.getTime()/1000)}:R>.`, ephemeral: true });
        }
      }
    }

    // UPDATE ACTIVE DUTY TIMESTAMP
    if (userRecord) {
      userRecord.lastActive = new Date();
      await userRecord.save();
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
};