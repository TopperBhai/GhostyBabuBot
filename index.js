require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');
const admin = require('firebase-admin');
const { SYSTEM_PROMPT } = require('./system-prompt');

// Initialize Firebase (optional memory module)
let db = null;
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
    db = admin.firestore();
    console.log("🔥 Firebase initialized for memories!");
  }
} catch(e) {
  console.log("Firebase not initialized. Ghosty will run without long-term memory for now.");
}

// Initialize OpenAI using NVIDIA's base URL
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL'] // Required to receive DMs
});

// A simple in-memory history map: userId -> array of messages
const chatHistory = new Map();

client.on('ready', () => {
  console.log(`👻 Ghosty Babu is online and logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Check if bot is mentioned or if it's a DM
  const isMentioned = message.mentions.has(client.user.id);
  const isDM = message.channel.type === 1; // 1 = DM

  if (!isMentioned && !isDM) return;

  // Clean the message content by removing the bot mention
  const userText = message.content.replace(new RegExp(`<@!?${client.user.id}>`), '').trim();
  if (!userText && message.attachments.size === 0) return;

  // Indicate bot is typing...
  try {
    await message.channel.sendTyping();
  } catch (e) {}

  const userId = message.author.id;
  
  // Get chat history for this user
  if (!chatHistory.has(userId)) {
    chatHistory.set(userId, []);
  }
  const history = chatHistory.get(userId);

  // Push user message to history
  history.push({ role: 'user', content: userText || "(User sent an attachment)" });

  // Keep history short (last 10 messages)
  if (history.length > 10) history.shift();

  try {
    // Call NVIDIA API (Using 70B because it understands natural Hinglish way better)
    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history
      ],
      temperature: 0.8,
      max_tokens: 60,
      top_p: 1,
    });

    const reply = completion.choices[0]?.message?.content;
    
    if (reply) {
      history.push({ role: 'assistant', content: reply });
      message.reply(reply);
    } else {
      message.reply("bro my brain just lagged fr fr 💀");
    }

  } catch (error) {
    console.error("NVIDIA API Error:", error.message || error);
    message.reply("nah im too tired to reply rn 💀 (API Error)");
  }
});

if (!process.env.DISCORD_BOT_TOKEN) {
  console.error("CRITICAL: DISCORD_BOT_TOKEN is missing in .env!");
  process.exit(1);
}

if (!process.env.NVIDIA_API_KEY) {
  console.error("CRITICAL: NVIDIA_API_KEY is missing in .env!");
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);
