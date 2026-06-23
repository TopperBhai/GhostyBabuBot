module.exports = {
  data: {
    name: 'help',
    description: 'A super simple guide to everything Ghosty Babu can do! (Baby Friendly 🍼)',
    options: []
  },
  async execute(interaction, client) {
    const embed = {
      color: 0x00FFBB, // Bright friendly color
      author: {
        name: "🍼 GhostVerse for Dummies (Super Simple Guide)",
        icon_url: client.user.displayAvatarURL()
      },
      description: "Welcome! Here is literally everything you can do, explained so simply that even a baby could understand it. \n\n**Free Money:** Just chat in the server or sit in a Voice Channel to passively earn Ghost Coins! 🪙",
      fields: [
        {
          name: "🙋‍♂️ 1. WHO AM I?",
          value: "👉 **`/profile`** - See your money, your job, your items, and if you are in jail.\n👉 **`/inventory`** - Look inside your bag to see items you own.\n👉 **`/leaderboard`** - Find out who is the richest or strongest player.",
          inline: false
        },
        {
          name: "💼 2. HOW TO MAKE MONEY (Legal & Safe)",
          value: "👉 **`/job apply`** - Get a normal job (like Police or Doctor) and get paid every hour.\n👉 **`/police arrest`** - (Cops Only) Arrest criminals and steal 15% of their money!\n👉 **`/business buy`** - Buy a Farm, Factory, Media Company or Casino!\n👉 **`/market sell`** - Sell the stuff your business made for big profits.\n👉 **`/realestate buy`** - Buy a house and people will pay you rent every hour.\n👉 **`/stock buy`** - Gamble your money in the stock market.\n👉 **`/bank`** - Store your money safely in the central bank.\n👉 **`/pay`** - Transfer money to another player (5% State Tax applies).",
          inline: false
        },
        {
          name: "😈 3. HOW TO MAKE MONEY (Illegal & Dangerous)",
          value: "👉 **`/heist`** - Try to rob the bank! If you win, you get rich. If you lose, you go to PRISON.\n👉 **`/mafia extort`** - If you are in the Mafia, you can steal from businesses.\n👉 **`/blackmarket buy`** - Buy illegal items in secret to help you win heists.",
          inline: false
        },
        {
          name: "🏛️ 4. POLITICS & NATIONS",
          value: "👉 **`/join`** - Join a team (Nation) like *Pookie Cult* or *Kaleshi Kingdom*.\n👉 **`/war declare`** - Attack another Nation to steal their money!\n👉 **`/government vote`** - Vote for someone to become the President.\n👉 **`/media publish`** - Spread fake news to the whole server!\n👉 **`/government policy`** - If you are President, you can raise or lower taxes for everyone!",
          inline: false
        },
        {
          name: "🔮 5. MAGIC, CULTS & FAMILY",
          value: "👉 **`/cult found`** - Start your own religion! People can join it to get special superpowers.\n👉 **`/family`** - Propose marriage or adopt children to build a legacy.\n👉 **`/casino gamble`** - Gamble your money against player-owned casinos.\n👉 **`/mint`** - Pay 1 Million coins to create a custom legendary item just for you.",
          inline: false
        },
        {
          name: "😂 6. JUST FOR FUN (AI CHAT)",
          value: "👉 **`/rizz`** - Tag someone and I will hit on them.\n👉 **`/flirt`** - Tag someone and I will flirt with them.\n👉 **`/roast`** - Tag someone and I will brutally insult them.\n👉 **`/bhavishyavani`** - Ask me a question about your future and I'll predict it.",
          inline: false
        }
      ],
      footer: { text: "That's it! Start by doing /job apply right now! 🚀" }
    };

    return interaction.reply({ embeds: [embed] });
  }
};