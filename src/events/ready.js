const cron = require('node-cron');
const Nation = require('../models/Nation');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`👻 Ghosty Babu is online and logged in as ${client.user.tag}!`);

    // Initialize Nations in DB
    const coreNations = ['Kaleshi Kingdom', 'Pookie Cult', 'Nalle Berozgar', 'VIP Backbenchers', 'Badmosh Syndicate'];
    for (const nationName of coreNations) {
      await Nation.findOneAndUpdate(
        { name: nationName },
        { $setOnInsert: { name: nationName, population: 0, treasury: 10000, gdp: 500 } },
        { upsert: true }
      ).catch(err => console.error(`Failed to initialize nation ${nationName}:`, err));
    }
    console.log("Nations initialized in MongoDB!");

    // The Stock Market is now seeded manually via setup_phase6.js.
    // We no longer initialize the old coreStocks here.

    const commandsData = Array.from(client.commands.values()).map(cmd => cmd.data);
    try {
      await client.application.commands.set(commandsData);
      console.log("Slash commands registered dynamically!");
    } catch (err) {
      console.error("Error registering slash commands:", err);
    }

    cron.schedule('0 0 * * 0', async () => {
      console.log("Creating Parallel Universe channels...");
      for (const guild of client.guilds.cache.values()) {
        try {
          await guild.channels.create({ name: 'mars', type: 0 }); 
          await guild.channels.create({ name: 'hell', type: 0 });
          await guild.channels.create({ name: 'dreamworld', type: 0 });
        } catch (err) { }
      }
    });

    cron.schedule('0 0 * * 1', async () => {
      console.log("Deleting Parallel Universe channels...");
      for (const guild of client.guilds.cache.values()) {
        const channelsToDelete = guild.channels.cache.filter(c => ['mars', 'hell', 'dreamworld'].includes(c.name));
        for (const channel of channelsToDelete.values()) {
          try { await channel.delete(); } catch (err) {}
        }
      }
    });

    // Random spirit popups removed per user request.
  }
};