module.exports = {
  data: {
    name: 'inventory',
    description: 'Check how many rare ghosts you have caught.',
    options: []
  },
  async execute(interaction, client) {
    const inv = client.ghostInventory.get(interaction.user.id) || [];
  if (inv.length === 0) {
    return interaction.reply("teri inventory ekdum khali hai bhai, zero ghosts 💀 jaake catch kar");
  }
  const ghostCounts = {};
  inv.forEach(g => {
    ghostCounts[g.type] = (ghostCounts[g.type] || 0) + 1;
  });
  let desc = "👻 **Teri Ghost Inventory:**\n";
  for (const [gType, count] of Object.entries(ghostCounts)) {
    desc += `- ${gType}: **x${count}**\n`;
  }
  return interaction.reply(desc);
  }
};