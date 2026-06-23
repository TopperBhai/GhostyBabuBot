module.exports = {
  data: {
    name: 'catch',
    description: 'Catch an active Lost Spirit if one has spawned!',
    options: []
  },
  async execute(interaction, client) {
    const RARE_GHOSTS = ["🌌 Cosmic Spirit", "🔥 Hellfire Ghost", "👻 Gully Ka Bhoot", "💀 Narak Pishach", "✨ Shiny Chudail"];
  if (!client.activeSpirit || client.activeSpirit.channelId !== interaction.channelId) {
    return interaction.reply("bhai kaha hai bhoot? hawa me haath maar raha hai 💀 nasha kam kar");
  }

  const ghostType = RARE_GHOSTS[Math.floor(Math.random() * RARE_GHOSTS.length)];
  client.activeSpirit = null;

  if (!client.ghostInventory.has(interaction.user.id)) {
    client.ghostInventory.set(interaction.user.id, []);
  }
  const inv = client.ghostInventory.get(interaction.user.id);
  inv.push({ type: ghostType, caughtAt: Date.now() });
  client.saveGhostInventory();

  return interaction.reply(`🎉 **BINGO!** <@${interaction.user.id}> caught a **${ghostType}**! Pokemon Go master pro max 💀`);
  }
};