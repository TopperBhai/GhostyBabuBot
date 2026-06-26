const { ChannelType } = require('discord.js');
const { SYSTEM_PROMPT } = require('../../system-prompt');
const User = require('../models/User');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    // Economy Hook (Passive Income)
    if (client.redis) {
      const cooldownKey = `cooldown_msg_${message.author.id}`;
      const isCooldown = await client.redis.get(cooldownKey);
      if (!isCooldown) {
        await client.redis.set(cooldownKey, '1', 'EX', 300); // 5 min cooldown
        const coinsEarned = 1; // 1 coin per 5 mins active chat
        User.findOneAndUpdate(
          { discordId: message.author.id },
          { $inc: { wallet: coinsEarned } },
          { upsert: true }
        ).catch(()=>{});
      }
    }

    const isMentioned = message.mentions.has(client.user.id);
    const isDM = message.channel.type === ChannelType.DM || message.channel.type === 1;

    if (!isMentioned && !isDM) return;

    const userText = message.content.replace(new RegExp(`<@!?${client.user.id}>`), '').trim();
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

    // RAM Leak Protection: Evict inactive chat logs
    if (!client.chatSweepTimer) {
      client.chatSweepTimer = setInterval(() => {
        if (client.chatHistory.size > 200) {
          client.chatHistory.clear();
          console.log('🧹 [MEMORY SWEEP] Purged AI chat history cache to prevent RAM overflow.');
        }
      }, 30 * 60 * 1000); // Check every 30 mins
    }

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
};