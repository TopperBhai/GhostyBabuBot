const cron = require('node-cron');
const Nation = require('../models/Nation');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`👻 Ghosty Babu is online and logged in as ${client.user.tag}!`);

    // Initialize Nations in DB
    const coreNations = ['Shadow Empire', 'Frost Union', 'Crimson Kingdom', 'Neon Republic', 'Lost Souls'];
    for (const nationName of coreNations) {
      await Nation.findOneAndUpdate(
        { name: nationName },
        { $setOnInsert: { name: nationName, population: 0, treasury: 10000, gdp: 500 } },
        { upsert: true }
      ).catch(err => console.error(`Failed to initialize nation ${nationName}:`, err));
    }
    console.log("Nations initialized in MongoDB!");

    // Initialize Stocks in DB
    const Stock = require('../models/Stock');
    const coreStocks = ['ShadowCorp', 'FrostTech', 'CrimsonArms', 'NeonMedia', 'LostAirlines'];
    for (const stockName of coreStocks) {
      await Stock.findOneAndUpdate(
        { name: stockName },
        { $setOnInsert: { name: stockName, price: 100, trend: 'STABLE', volatility: 5 } },
        { upsert: true }
      ).catch(err => console.error(`Failed to initialize stock ${stockName}:`, err));
    }
    console.log("Stocks initialized in MongoDB!");

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

    setInterval(async () => {
      if (Math.random() > 0.3) return;
      if (client.activeSpirit) return;

      const guilds = Array.from(client.guilds.cache.values());
      if (guilds.length === 0) return;
      const randomGuild = guilds[Math.floor(Math.random() * guilds.length)];
      
      const textChannels = Array.from(randomGuild.channels.cache.filter(c => c.type === 0).values());
      if (textChannels.length === 0) return;
      const randomChannel = textChannels[Math.floor(Math.random() * textChannels.length)];

      try {
        await randomChannel.send("👻 **A Lost Spirit has appeared in this channel!** 👻\nQuick, type `/catch` to claim it before it vanishes!");
        client.activeSpirit = { channelId: randomChannel.id, spawnedAt: Date.now() };
        
        setTimeout(() => {
          if (client.activeSpirit && client.activeSpirit.channelId === randomChannel.id) {
            client.activeSpirit = null;
            randomChannel.send("💨 The Lost Spirit got bored and vanished into the ether...").catch(()=>{});
          }
        }, 10 * 60 * 1000);
      } catch (err) {}
    }, 30 * 60 * 1000);
  }
};