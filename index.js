require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const cron = require('node-cron');
const OpenAI = require('openai');
const admin = require('firebase-admin');
const { SYSTEM_PROMPT } = require('./system-prompt');
const express = require('express');
const fs = require('fs');

// Dummy Express server to keep the bot alive on free hosting (like Render)
const app = express();
app.get('/', (req, res) => res.send('Ghosty Babu is alive!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Keep-alive server running on port ${PORT}`));

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
let chatHistory = new Map();
const HISTORY_FILE = './chat_history.json';

try {
  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(data);
    chatHistory = new Map(Object.entries(parsed));
  }
} catch (e) {
  console.error("Error loading chat history:", e);
}

function saveHistory() {
  try {
    const obj = Object.fromEntries(chatHistory);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(obj), 'utf8');
  } catch (e) {
    console.error("Error saving chat history:", e);
  }
}

let activeSpirit = null;
let ghostInventory = new Map();
const GHOST_FILE = './ghost_inventory.json';

try {
  if (fs.existsSync(GHOST_FILE)) {
    const data = fs.readFileSync(GHOST_FILE, 'utf8');
    ghostInventory = new Map(Object.entries(JSON.parse(data)));
  }
} catch (e) { console.error("Error loading ghost inventory:", e); }

function saveGhostInventory() {
  try {
    fs.writeFileSync(GHOST_FILE, JSON.stringify(Object.fromEntries(ghostInventory)), 'utf8');
  } catch (e) { console.error("Error saving ghost inventory:", e); }
}

const RARE_GHOSTS = ["🌌 Cosmic Spirit", "🔥 Hellfire Ghost", "👻 Gully Ka Bhoot", "💀 Narak Pishach", "✨ Shiny Chudail"];

client.on('ready', async () => {
  console.log(`👻 Ghosty Babu is online and logged in as ${client.user.tag}!`);

  try {
    await client.application.commands.set([
      {
        name: 'rizz',
        description: 'Tag a user and Ghosty Babu will rizz them up with Hinglish pickup lines.',
        options: [
          {
            name: 'user',
            description: 'The person you want to rizz up',
            type: 6, // USER type
            required: true,
          }
        ]
      },
      {
        name: 'flirt',
        description: 'Tag a user and Ghosty Babu will flirt with them in Hinglish.',
        options: [
          {
            name: 'user',
            description: 'The person you want to flirt with',
            type: 6, // USER type
            required: true,
          }
        ]
      },
      {
        name: 'roast',
        description: 'Tag a user and Ghosty Babu will brutally roast them in Hinglish.',
        options: [
          {
            name: 'user',
            description: 'The person you want to roast',
            type: 6, // USER type
            required: true,
          }
        ]
      },
      {
        name: 'bhavishyavani',
        description: 'Ask Ghosty Babu a question about your future.',
        options: [
          {
            name: 'question',
            description: 'The question you want to ask',
            type: 3, // STRING type
            required: true,
          }
        ]
      },
      {
        name: 'catch',
        description: 'Catch an active Lost Spirit if one has spawned!',
      },
      {
        name: 'inventory',
        description: 'Check how many rare ghosts you have caught.',
      },
      {
        name: 'help',
        description: 'See all the things Ghosty Babu can do.',
      }
    ]);
    console.log("Slash commands registered!");
  } catch (err) {
    console.error("Error registering slash commands:", err);
  }

  // Parallel Universe Cron - Create channels (Sunday 12:00 AM)
  cron.schedule('0 0 * * 0', async () => {
    console.log("Creating Parallel Universe channels...");
    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.channels.create({ name: 'mars', type: 0 }); // 0 = GUILD_TEXT
        await guild.channels.create({ name: 'hell', type: 0 });
        await guild.channels.create({ name: 'dreamworld', type: 0 });
      } catch (err) { console.error(`Failed to create channels in ${guild.name}:`, err); }
    }
  });

  // Parallel Universe Cron - Delete channels (Monday 12:00 AM)
  cron.schedule('0 0 * * 1', async () => {
    console.log("Deleting Parallel Universe channels...");
    for (const guild of client.guilds.cache.values()) {
      const channelsToDelete = guild.channels.cache.filter(c => ['mars', 'hell', 'dreamworld'].includes(c.name));
      for (const channel of channelsToDelete.values()) {
        try { await channel.delete(); } catch (err) { console.error(`Failed to delete channel in ${guild.name}:`, err); }
      }
    }
  });

  // Random Ghost Spawns (Check every 30 mins, roughly 30% chance to spawn)
  setInterval(async () => {
    if (Math.random() > 0.3) return;
    if (activeSpirit) return; // already active

    const guilds = Array.from(client.guilds.cache.values());
    if (guilds.length === 0) return;
    const randomGuild = guilds[Math.floor(Math.random() * guilds.length)];
    
    const textChannels = Array.from(randomGuild.channels.cache.filter(c => c.type === 0).values());
    if (textChannels.length === 0) return;
    const randomChannel = textChannels[Math.floor(Math.random() * textChannels.length)];

    try {
      await randomChannel.send("👻 **A Lost Spirit has appeared in this channel!** 👻\nQuick, type `/catch` to claim it before it vanishes!");
      activeSpirit = { channelId: randomChannel.id, spawnedAt: Date.now() };
      
      setTimeout(() => {
        if (activeSpirit && activeSpirit.channelId === randomChannel.id) {
          activeSpirit = null;
          randomChannel.send("💨 The Lost Spirit got bored and vanished into the ether...").catch(()=>{});
        }
      }, 10 * 60 * 1000);
    } catch (err) { console.error("Could not send spirit spawn message:", err); }

  }, 30 * 60 * 1000);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (['rizz', 'flirt', 'roast'].includes(interaction.commandName)) {
    const targetUser = interaction.options.getUser('user');
    const targetMember = interaction.options.getMember('user');

    if (targetUser.id === client.user.id) {
      const errorMsg = interaction.commandName === 'rizz' 
        ? "bhai kisko rizz karu? mere alawa kisi insaan ko tag kar 💀"
        : interaction.commandName === 'flirt'
        ? "bhai mujhse hi flirt karega kya? kisi insaan ko tag kar 💀"
        : "bhai khudko hi roast karu kya? kisi insaan ko tag kar 💀";
      return interaction.reply({ content: errorMsg, ephemeral: true });
    }

    await interaction.deferReply();

    let systemPrompt = "";
    if (interaction.commandName === 'rizz') {
      systemPrompt = "You are Ghosty Babu, an Indian Gen-Z teenager and a master of Hinglish rizz. Generate a smooth, funny, and slightly dramatic Hinglish pickup line for the user mentioned. CRITICAL RULE: Write ONLY in natural conversational Hinglish. Do NOT provide any English translation. Do NOT use quotation marks. Just give the pure Hinglish text. Keep it short (1-2 lines), very gen-z, use emojis, and don't be creepy.";
    } else if (interaction.commandName === 'flirt') {
      systemPrompt = "You are Ghosty Babu, a cheeky Indian Gen-Z teenager. Flirt with the user mentioned in natural, romantic yet funny Hinglish. Be playful and cheesy. CRITICAL RULE: Write ONLY in natural conversational Hinglish. Do NOT provide any English translation. Do NOT use quotation marks. Just give the pure Hinglish text. Keep it short (1-2 lines), very gen-z, use emojis.";
    } else {
      systemPrompt = "You are Ghosty Babu, a highly toxic Indian Gen-Z teenager. Brutally roast the mentioned user in Hinglish. Be creative, savage, and don't hold back. Use Gen-Z slangs. CRITICAL RULE: Write ONLY in natural conversational Hinglish. Do NOT provide any English translation. Do NOT use quotation marks. Keep it short (1-2 lines), use emojis.";
    }

    let targetName = targetUser.username;
    let targetPronouns = "";

    if (targetMember) {
      targetName = targetMember.displayName || targetUser.username;
      const roles = targetMember.roles.cache.filter(r => r.name.toLowerCase().includes('he/') || r.name.toLowerCase().includes('she/') || r.name.toLowerCase().includes('they/')).map(r => r.name).join(', ');
      if (roles) targetPronouns = ` (Pronouns: ${roles})`;
    }

    let userPrompt = "";
    if (interaction.commandName === 'rizz') {
      userPrompt = `Rizz up this user: ${targetName}${targetPronouns}`;
    } else if (interaction.commandName === 'flirt') {
      userPrompt = `Flirt with this user: ${targetName}${targetPronouns}`;
    } else {
      userPrompt = `Roast this user brutally: ${targetName}${targetPronouns}`;
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 80,
        top_p: 1,
      });

      let reply = completion.choices[0]?.message?.content?.trim();
      
      if (reply && reply.startsWith('"') && reply.endsWith('"')) {
        reply = reply.slice(1, -1);
      }
      reply = reply.replace(/\(.*?\)/g, '').trim();

      if (reply) {
        await interaction.editReply(`<@${targetUser.id}> ${reply}`);
        
        // Add to chat history so the bot remembers the context of the rizz/flirt
        if (!chatHistory.has(targetUser.id)) {
          chatHistory.set(targetUser.id, []);
        }
        const userHistory = chatHistory.get(targetUser.id);
        userHistory.push({ role: 'user', content: `[User triggered /${interaction.commandName}]` });
        userHistory.push({ role: 'assistant', content: reply });
        while (userHistory.length > 20) userHistory.shift();
        saveHistory();

      } else {
        await interaction.editReply(`bro my ${interaction.commandName} module just crashed fr fr 💀`);
      }
    } catch (error) {
      console.error("NVIDIA API Error:", error.message || error);
      await interaction.editReply(`nah im too tired to ${interaction.commandName} rn 💀 (API Error)`);
    }
  } else if (interaction.commandName === 'bhavishyavani') {
    const question = interaction.options.getString('question');
    const targetUser = interaction.user;

    await interaction.deferReply();

    const systemPrompt = "You are Ghosty Babu, acting as a scammy, sarcastic Indian Gen-Z astrologer. Give them a hilariously harsh, realistic, or brutally honest 'prediction' in Hinglish about their question. CRITICAL RULE: Write ONLY in natural conversational Hinglish. NO ENGLISH TRANSLATIONS. Keep it short (1-2 lines), use emojis.";
    const userPrompt = `Question from ${targetUser.username}: ${question}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 80,
        top_p: 1,
      });

      let reply = completion.choices[0]?.message?.content?.trim();
      
      if (reply && reply.startsWith('"') && reply.endsWith('"')) {
        reply = reply.slice(1, -1);
      }
      reply = reply.replace(/\(.*?\)/g, '').trim();

      if (reply) {
        await interaction.editReply(`**Question:** ${question}\n**Bhavishyavani:** ${reply}`);
        
        if (!chatHistory.has(targetUser.id)) {
          chatHistory.set(targetUser.id, []);
        }
        const userHistory = chatHistory.get(targetUser.id);
        userHistory.push({ role: 'user', content: `[User triggered /bhavishyavani: ${question}]` });
        userHistory.push({ role: 'assistant', content: reply });
        while (userHistory.length > 20) userHistory.shift();
        saveHistory();

      } else {
        await interaction.editReply(`bro meri teesri aankh kharab ho gayi 💀`);
      }
    } catch (error) {
      console.error("NVIDIA API Error:", error.message || error);
      await interaction.editReply(`nah my chakras are blocked rn 💀 (API Error)`);
    }
  } else if (interaction.commandName === 'catch') {
    if (!activeSpirit || activeSpirit.channelId !== interaction.channelId) {
      return interaction.reply("bhai kaha hai bhoot? hawa me haath maar raha hai 💀 nasha kam kar");
    }

    const ghostType = RARE_GHOSTS[Math.floor(Math.random() * RARE_GHOSTS.length)];
    activeSpirit = null;

    if (!ghostInventory.has(interaction.user.id)) {
      ghostInventory.set(interaction.user.id, []);
    }
    const inv = ghostInventory.get(interaction.user.id);
    inv.push({ type: ghostType, caughtAt: Date.now() });
    saveGhostInventory();

    return interaction.reply(`🎉 **BINGO!** <@${interaction.user.id}> caught a **${ghostType}**! Pokemon Go master pro max 💀`);

  } else if (interaction.commandName === 'inventory') {
    const inv = ghostInventory.get(interaction.user.id) || [];
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
  } else if (interaction.commandName === 'help') {
    const helpMsg = `👻 **Ghosty Babu Help Menu** 👻\n\n` +
      `**Commands:**\n` +
      `\`/rizz <user>\` - Rizz someone up in Hinglish\n` +
      `\`/flirt <user>\` - Flirt with someone in Hinglish\n` +
      `\`/roast <user>\` - Brutally roast someone in Hinglish\n` +
      `\`/bhavishyavani <question>\` - Get a scammy prediction for your future\n` +
      `\`/catch\` - Catch a Lost Spirit when it randomly spawns in the server\n` +
      `\`/inventory\` - View your rare ghost collection\n` +
      `\`/help\` - Show this menu\n\n` +
      `**Features:**\n` +
      `• **Parallel Universe**: Every Sunday, exclusive temporary channels (#mars, #hell, #dreamworld) open up!\n` +
      `• **DMs**: You can DM me directly to chat privately!`;
    return interaction.reply({ content: helpMsg, ephemeral: false });
  }
});

client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Check if bot is mentioned or if it's a DM
  const isMentioned = message.mentions.has(client.user.id);
  const isDM = message.channel.type === ChannelType.DM || message.channel.type === 1; // 1 = fallback DM

  if (!isMentioned && !isDM) return;

  // Clean the message content by removing the bot mention
  const userText = message.content.replace(new RegExp(`<@!?${client.user.id}>`), '').trim();
  if (!userText && message.attachments.size === 0) return;

  // Indicate bot is typing continuously until reply is ready
  let typingInterval;
  try {
    await message.channel.sendTyping();
    typingInterval = setInterval(() => {
      message.channel.sendTyping().catch(() => {});
    }, 9000); // Discord typing indicator expires after 10s, refresh every 9s
  } catch (e) {}

  const userId = message.author.id;
  
  // Get chat history for this user
  if (!chatHistory.has(userId)) {
    chatHistory.set(userId, []);
  }
  const history = chatHistory.get(userId);

  const member = message.member;
  let nameToUse = message.author.username;
  let pronouns = "";

  if (member) {
    nameToUse = member.displayName || message.author.username;
    const roles = member.roles.cache.filter(r => r.name.toLowerCase().includes('he/') || r.name.toLowerCase().includes('she/') || r.name.toLowerCase().includes('they/')).map(r => r.name).join(', ');
    if (roles) pronouns = `, Pronouns: ${roles}`;
  }

  const contextPrefix = `[User: ${nameToUse}${pronouns}]`;
  const contentToPush = userText ? `${contextPrefix} ${userText}` : `${contextPrefix} (Sent an attachment)`;

  // Push user message to history
  history.push({ role: 'user', content: contentToPush });

  // Keep history short (last 20 messages)
  while (history.length > 20) history.shift();
  saveHistory();

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
      while (history.length > 20) history.shift();
      saveHistory();
      try {
        await message.reply(reply);
      } catch (err) {
        // Fallback if original message was deleted
        await message.channel.send(reply).catch(() => {});
      }
    } else {
      await message.reply("bro my brain just lagged fr fr 💀").catch(() => {});
    }

  } catch (error) {
    console.error("NVIDIA API Error:", error.message || error);
    await message.reply("nah im too tired to reply rn 💀 (API Error)").catch(() => {});
  } finally {
    // Always clear the typing interval
    if (typingInterval) clearInterval(typingInterval);
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
