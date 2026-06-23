const User = require('../models/User');

module.exports = {
  data: {
    name: 'pardon',
    description: '(Admin) Release all prisoners from Jail.',
    options: []
  },
  async execute(interaction, client) {
    // Basic security: Check if the user is the owner/admin
    // (You can replace this with your actual Discord ID if you want to be the only one)
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: "You do not have permission to pardon criminals.", ephemeral: true });
    }

    try {
      const result = await User.updateMany(
        { jailUntil: { $ne: null } },
        { $set: { jailUntil: null } }
      );
      
      return interaction.reply(`🎉 **PRESIDENTIAL PARDON!**\nAll ${result.modifiedCount} prisoners have been released from Jail!`);
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: "Failed to release prisoners.", ephemeral: true });
    }
  }
};
