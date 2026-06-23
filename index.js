require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const Market = require('./src/models/Market');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();
client.openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log("✅ Connected to MongoDB Atlas!");
    
    // Seed Market Data
    const commodities = ['Food', 'Ore', 'Goods', 'Meals'];
    for (const c of commodities) {
      const exists = await Market.findOne({ commodity: c });
      if (!exists) {
        let basePrice = 50;
        if (c === 'Ore') basePrice = 100;
        if (c === 'Goods') basePrice = 300;
        if (c === 'Meals') basePrice = 200;
        await new Market({ commodity: c, price: basePrice, supply: 10000, demand: 10000 }).save();
      }
    }
    console.log('✅ Global Market Seeded');
    
    client.login(process.env.DISCORD_BOT_TOKEN);
  }).catch(err => console.error("❌ MongoDB Error:", err));
}

// Connect to Redis
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('connect', () => console.log("✅ Connected to Upstash Redis!"));
  redisClient.on('error', (err) => console.error("❌ Redis Error:", err));
}
client.redis = redisClient;

client.chatHistory = new Map();
client.saveHistory = () => {};

client.activeSpirit = null;

// Keep-alive server
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('GhostVerse Engine is booting...'));
app.listen(process.env.PORT || 3000, () => console.log('Keep-alive server running.'));

// Load Events
const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Load Commands
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

// Start Systems
require('./src/systems/ghostLeaks')(client);
require('./src/systems/stockMarket')(client);
require('./src/systems/disasters')(client);
require('./src/systems/newspaper')(client);
require('./src/systems/tickEngine')(client);

if (!process.env.DISCORD_BOT_TOKEN || !process.env.NVIDIA_API_KEY) {
  console.error("CRITICAL: Missing DISCORD_BOT_TOKEN or NVIDIA_API_KEY in .env");
  process.exit(1);
}
