const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, 'src', 'commands');
const eventsDir = path.join(__dirname, 'src', 'events');

if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir, { recursive: true });
if (!fs.existsSync(eventsDir)) fs.mkdirSync(eventsDir, { recursive: true });

function generateCommand(name, desc, options = [], executeLogic) {
  const content = "module.exports = {\n" +
  "  data: {\n" +
  "    name: '" + name + "',\n" +
  "    description: '" + desc + "',\n" +
  "    options: " + JSON.stringify(options, null, 2) + "\n" +
  "  },\n" +
  "  async execute(interaction, client) {\n" +
  "    " + executeLogic + "\n" +
  "  }\n" +
  "};";
  fs.writeFileSync(path.join(commandsDir, `${name}.js`), content);
}

generateCommand('rizz', 'Tag a user and Ghosty Babu will rizz them up with Hinglish pickup lines.', 
  [{ name: 'user', description: 'The person you want to rizz up', type: 6, required: true }],
  "await require('../../handlers/personaHandler')(interaction, client, 'rizz');"
);

generateCommand('flirt', 'Tag a user and Ghosty Babu will flirt with them in Hinglish.', 
  [{ name: 'user', description: 'The person you want to flirt with', type: 6, required: true }],
  "await require('../../handlers/personaHandler')(interaction, client, 'flirt');"
);

generateCommand('roast', 'Tag a user and Ghosty Babu will brutally roast them in Hinglish.', 
  [{ name: 'user', description: 'The person you want to roast', type: 6, required: true }],
  "await require('../../handlers/personaHandler')(interaction, client, 'roast');"
);

generateCommand('bhavishyavani', 'Ask Ghosty Babu a question about your future.', 
  [{ name: 'question', description: 'The question you want to ask', type: 3, required: true }],
  "await require('../../handlers/personaHandler')(interaction, client, 'bhavishyavani');"
);

generateCommand('catch', 'Catch an active Lost Spirit if one has spawned!', [],
  `const RARE_GHOSTS = ["🌌 Cosmic Spirit", "🔥 Hellfire Ghost", "👻 Gully Ka Bhoot", "💀 Narak Pishach", "✨ Shiny Chudail"];
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

  return interaction.reply(\`🎉 **BINGO!** <@\${interaction.user.id}> caught a **\${ghostType}**! Pokemon Go master pro max 💀\`);`
);

generateCommand('inventory', 'Check how many rare ghosts you have caught.', [],
  `const inv = client.ghostInventory.get(interaction.user.id) || [];
  if (inv.length === 0) {
    return interaction.reply("teri inventory ekdum khali hai bhai, zero ghosts 💀 jaake catch kar");
  }
  const ghostCounts = {};
  inv.forEach(g => {
    ghostCounts[g.type] = (ghostCounts[g.type] || 0) + 1;
  });
  let desc = "👻 **Teri Ghost Inventory:**\\n";
  for (const [gType, count] of Object.entries(ghostCounts)) {
    desc += \`- \${gType}: **x\${count}**\\n\`;
  }
  return interaction.reply(desc);`
);

generateCommand('help', 'See all the things Ghosty Babu can do.', [],
  `const helpMsg = "👻 **Ghosty Babu Help Menu** 👻\\n\\n" +
    "**Commands:**\\n" +
    "\`/rizz <user>\` - Rizz someone up in Hinglish\\n" +
    "\`/flirt <user>\` - Flirt with someone in Hinglish\\n" +
    "\`/roast <user>\` - Brutally roast someone in Hinglish\\n" +
    "\`/bhavishyavani <question>\` - Get a scammy prediction for your future\\n" +
    "\`/catch\` - Catch a Lost Spirit when it randomly spawns in the server\\n" +
    "\`/inventory\` - View your rare ghost collection\\n" +
    "\`/help\` - Show this menu\\n\\n" +
    "**🚀 COMING SOON: GHOSTVERSE**\\n" +
    "• **Nations & Wars**: Join a nation, elect leaders, declare wars, and conquer!\\n" +
    "• **Player Economy**: Buy businesses, invest in stocks, and become a billionaire.\\n" +
    "• **Underworld**: Plan heists, trade on the Black Market, and bribe your way out of Prison.\\n" +
    "• **GhostLeaks**: Anonymous rumors and newspaper articles detailing the server's juicy drama.\\n\\n" +
    "*Prepare yourself. The world is about to change.* ";
  return interaction.reply({ content: helpMsg, ephemeral: false });`
);

const handlersDir = path.join(__dirname, 'src', 'handlers');
if (!fs.existsSync(handlersDir)) fs.mkdirSync(handlersDir, { recursive: true });

fs.writeFileSync(path.join(handlersDir, 'personaHandler.js'), `
const { SYSTEM_PROMPT } = require('../../system-prompt');

module.exports = async (interaction, client, type) => {
  const targetUser = interaction.options.getUser('user');
  const targetMember = interaction.options.getMember('user');
  const question = interaction.options.getString('question');

  if (targetUser && targetUser.id === client.user.id) {
    const errorMsg = type === 'rizz' 
      ? "bhai kisko rizz karu? mere alawa kisi insaan ko tag kar 💀"
      : type === 'flirt'
      ? "bhai mujhse hi flirt karega kya? kisi insaan ko tag kar 💀"
      : type === 'roast'
      ? "bhai khudko hi roast karu kya? kisi insaan ko tag kar 💀"
      : "kya kar raha hai bhai";
    return interaction.reply({ content: errorMsg, ephemeral: true });
  }

  await interaction.deferReply();

  let systemPrompt = "";
  if (type === 'rizz') {
    systemPrompt = "You are Ghosty Babu, an Indian Gen-Z teenager and a master of Hinglish rizz. Generate a smooth, funny, and slightly dramatic Hinglish pickup line for the user mentioned. CRITICAL RULE: Write ONLY in natural conversational Hinglish. Do NOT provide any English translation. Do NOT use quotation marks. Just give the pure Hinglish text. Keep it short (1-2 lines), very gen-z, use emojis, and don't be creepy.";
  } else if (type === 'flirt') {
    systemPrompt = "You are Ghosty Babu, a cheeky Indian Gen-Z teenager. Flirt with the user mentioned in natural, romantic yet funny Hinglish. Be playful and cheesy. CRITICAL RULE: Write ONLY in natural conversational Hinglish. Do NOT provide any English translation. Do NOT use quotation marks. Just give the pure Hinglish text. Keep it short (1-2 lines), very gen-z, use emojis.";
  } else if (type === 'roast') {
    systemPrompt = "You are Ghosty Babu, a highly toxic Indian Gen-Z teenager. Brutally roast the mentioned user in Hinglish. Be creative, savage, and don't hold back. Use Gen-Z slangs. CRITICAL RULE: Write ONLY in natural conversational Hinglish. Do NOT provide any English translation. Do NOT use quotation marks. Keep it short (1-2 lines), use emojis.";
  } else if (type === 'bhavishyavani') {
    systemPrompt = "You are Ghosty Babu, acting as a scammy, sarcastic Indian Gen-Z astrologer. Give them a hilariously harsh, realistic, or brutally honest 'prediction' in Hinglish about their question. CRITICAL RULE: Write ONLY in natural conversational Hinglish. NO ENGLISH TRANSLATIONS. Keep it short (1-2 lines), use emojis.";
  }

  let userPrompt = "";
  if (type === 'bhavishyavani') {
    userPrompt = \`Question from \${interaction.user.username}: \${question}\`;
  } else {
    let targetName = targetUser.username;
    let targetPronouns = "";

    if (targetMember) {
      targetName = targetMember.displayName || targetUser.username;
      const roles = targetMember.roles.cache.filter(r => r.name.toLowerCase().includes('he/') || r.name.toLowerCase().includes('she/') || r.name.toLowerCase().includes('they/')).map(r => r.name).join(', ');
      if (roles) targetPronouns = \` (Pronouns: \${roles})\`;
    }

    if (type === 'rizz') userPrompt = \`Rizz up this user: \${targetName}\${targetPronouns}\`;
    else if (type === 'flirt') userPrompt = \`Flirt with this user: \${targetName}\${targetPronouns}\`;
    else if (type === 'roast') userPrompt = \`Roast this user brutally: \${targetName}\${targetPronouns}\`;
  }

  try {
    const completion = await client.openai.chat.completions.create({
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
    if (reply && reply.startsWith('"') && reply.endsWith('"')) reply = reply.slice(1, -1);
    reply = reply.replace(/\\(.*?\\)/g, '').trim();

    if (reply) {
      const displayReply = type === 'bhavishyavani' 
        ? \`**Question:** \${question}\\n**Bhavishyavani:** \${reply}\`
        : \`<@\${targetUser.id}> \${reply}\`;

      await interaction.editReply(displayReply);
      
      const historyTarget = type === 'bhavishyavani' ? interaction.user.id : targetUser.id;
      if (!client.chatHistory.has(historyTarget)) client.chatHistory.set(historyTarget, []);
      const userHistory = client.chatHistory.get(historyTarget);
      
      const actionText = type === 'bhavishyavani' ? \`/bhavishyavani: \${question}\` : \`/\${type}\`;
      userHistory.push({ role: 'user', content: \`[User triggered \${actionText}]\` });
      userHistory.push({ role: 'assistant', content: reply });
      while (userHistory.length > 20) userHistory.shift();
      client.saveHistory();

    } else {
      await interaction.editReply(\`bro my \${type} module just crashed fr fr 💀\`);
    }
  } catch (error) {
    console.error("NVIDIA API Error:", error.message || error);
    await interaction.editReply(\`nah im too tired to \${type} rn 💀 (API Error)\`);
  }
};
`);

const readyEvent = `const cron = require('node-cron');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(\`👻 Ghosty Babu is online and logged in as \${client.user.tag}!\`);

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
        await randomChannel.send("👻 **A Lost Spirit has appeared in this channel!** 👻\\nQuick, type \`/catch\` to claim it before it vanishes!");
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
};`;

fs.writeFileSync(path.join(eventsDir, 'ready.js'), readyEvent);

const interactionCreateEvent = `module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
};`;

fs.writeFileSync(path.join(eventsDir, 'interactionCreate.js'), interactionCreateEvent);

const messageCreateEvent = `const { ChannelType } = require('discord.js');
const { SYSTEM_PROMPT } = require('../../system-prompt');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    const isMentioned = message.mentions.has(client.user.id);
    const isDM = message.channel.type === ChannelType.DM || message.channel.type === 1;

    if (!isMentioned && !isDM) return;

    const userText = message.content.replace(new RegExp(\`<@!?\${client.user.id}>\`), '').trim();
    if (!userText && message.attachments.size === 0) return;

    let typingInterval;
    try {
      await message.channel.sendTyping();
      typingInterval = setInterval(() => {
        message.channel.sendTyping().catch(() => {});
      }, 9000);
    } catch (e) {}

    const userId = message.author.id;
    if (!client.chatHistory.has(userId)) {
      client.chatHistory.set(userId, []);
    }
    const history = client.chatHistory.get(userId);

    const member = message.member;
    let nameToUse = message.author.username;
    let pronouns = "";

    if (member) {
      nameToUse = member.displayName || message.author.username;
      const roles = member.roles.cache.filter(r => r.name.toLowerCase().includes('he/') || r.name.toLowerCase().includes('she/') || r.name.toLowerCase().includes('they/')).map(r => r.name).join(', ');
      if (roles) pronouns = \`, Pronouns: \${roles}\`;
    }

    const contextPrefix = \`[User: \${nameToUse}\${pronouns}]\`;
    const contentToPush = userText ? \`\${contextPrefix} \${userText}\` : \`\${contextPrefix} (Sent an attachment)\`;

    history.push({ role: 'user', content: contentToPush });
    while (history.length > 20) history.shift();
    client.saveHistory();

    try {
      const completion = await client.openai.chat.completions.create({
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
        client.saveHistory();
        try {
          await message.reply(reply);
        } catch (err) {
          await message.channel.send(reply).catch(() => {});
        }
      } else {
        await message.reply("bro my brain just lagged fr fr 💀").catch(() => {});
      }
    } catch (error) {
      console.error("NVIDIA API Error:", error.message || error);
      await message.reply("nah im too tired to reply rn 💀 (API Error)").catch(() => {});
    } finally {
      if (typingInterval) clearInterval(typingInterval);
    }
  }
};`;

fs.writeFileSync(path.join(eventsDir, 'messageCreate.js'), messageCreateEvent);

console.log("Modular files generated successfully!");
