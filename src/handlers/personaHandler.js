
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
    userPrompt = `Question from ${interaction.user.username}: ${question}`;
  } else {
    let targetName = targetUser.username;
    let targetPronouns = "";

    if (targetMember) {
      targetName = targetMember.displayName || targetUser.username;
      const roles = targetMember.roles.cache.filter(r => r.name.toLowerCase().includes('he/') || r.name.toLowerCase().includes('she/') || r.name.toLowerCase().includes('they/')).map(r => r.name).join(', ');
      if (roles) targetPronouns = ` (Pronouns: ${roles})`;
    }

    if (type === 'rizz') userPrompt = `Rizz up this user: ${targetName}${targetPronouns}`;
    else if (type === 'flirt') userPrompt = `Flirt with this user: ${targetName}${targetPronouns}`;
    else if (type === 'roast') userPrompt = `Roast this user brutally: ${targetName}${targetPronouns}`;
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
    reply = reply.replace(/\(.*?\)/g, '').trim();

    if (reply) {
      const displayReply = type === 'bhavishyavani' 
        ? `**Question:** ${question}\n**Bhavishyavani:** ${reply}`
        : `<@${targetUser.id}> ${reply}`;

      await interaction.editReply(displayReply);
      
      const historyTarget = type === 'bhavishyavani' ? interaction.user.id : targetUser.id;
      if (!client.chatHistory.has(historyTarget)) client.chatHistory.set(historyTarget, []);
      const userHistory = client.chatHistory.get(historyTarget);
      
      const actionText = type === 'bhavishyavani' ? `/bhavishyavani: ${question}` : `/${type}`;
      userHistory.push({ role: 'user', content: `[User triggered ${actionText}]` });
      userHistory.push({ role: 'assistant', content: reply });
      while (userHistory.length > 20) userHistory.shift();
      client.saveHistory();

    } else {
      await interaction.editReply(`bro my ${type} module just crashed fr fr 💀`);
    }
  } catch (error) {
    console.error("NVIDIA API Error:", error.message || error);
    await interaction.editReply(`nah im too tired to ${type} rn 💀 (API Error)`);
  }
};
