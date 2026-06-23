require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL']
});

client.commands = new Collection();
client.openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const mongoose = require('mongoose');
const Redis = require('ioredis');

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("✅ Connected to MongoDB Atlas!");
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

if (!process.env.DISCORD_BOT_TOKEN || !process.env.NVIDIA_API_KEY) {
  console.error("CRITICAL: Missing DISCORD_BOT_TOKEN or NVIDIA_API_KEY in .env");
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);
