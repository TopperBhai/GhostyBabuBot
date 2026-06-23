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

// Mock Database (Phase 1)
client.chatHistory = new Map();
client.ghostInventory = new Map();
const HISTORY_FILE = './chat_history.json';
const GHOST_FILE = './ghost_inventory.json';

try {
  if (fs.existsSync(HISTORY_FILE)) {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    client.chatHistory = new Map(Object.entries(data));
  }
  if (fs.existsSync(GHOST_FILE)) {
    const data = JSON.parse(fs.readFileSync(GHOST_FILE, 'utf8'));
    client.ghostInventory = new Map(Object.entries(data));
  }
} catch (e) { console.error("Error loading mock DB", e); }

client.saveHistory = () => {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(Object.fromEntries(client.chatHistory)), 'utf8');
  } catch (e) {}
};
client.saveGhostInventory = () => {
  try {
    fs.writeFileSync(GHOST_FILE, JSON.stringify(Object.fromEntries(client.ghostInventory)), 'utf8');
  } catch (e) {}
};

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

if (!process.env.DISCORD_BOT_TOKEN || !process.env.NVIDIA_API_KEY) {
  console.error("CRITICAL: Missing DISCORD_BOT_TOKEN or NVIDIA_API_KEY in .env");
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);
