const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const systemsDir = path.join(__dirname, 'src', 'systems');
const commandsDir = path.join(__dirname, 'src', 'commands');
const eventsDir = path.join(__dirname, 'src', 'events');

// Update User Schema to include portfolio
const userSchemaContent = `
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 0 },
  nation: { type: String, default: 'None' },
  role: { type: String, default: 'Citizen' },
  inventory: { type: Array, default: [] },
  portfolio: { type: Object, default: {} } // { stockName: sharesOwned }
});
module.exports = mongoose.model('User', userSchema);
`;
fs.writeFileSync(path.join(modelsDir, 'User.js'), userSchemaContent);

// Business Schema
fs.writeFileSync(path.join(modelsDir, 'Business.js'), `
const mongoose = require('mongoose');
const businessSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  type: { type: String, required: true }, // Mine, Factory, Bank, Casino
  level: { type: Number, default: 1 },
  lastCollected: { type: Number, default: Date.now }
});
module.exports = mongoose.model('Business', businessSchema);
`);

// Stock Schema
fs.writeFileSync(path.join(modelsDir, 'Stock.js'), `
const mongoose = require('mongoose');
const stockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // ShadowCorp, FrostTech, etc.
  price: { type: Number, default: 100 },
  trend: { type: String, default: 'STABLE' }, // BULL, BEAR, STABLE
  volatility: { type: Number, default: 5 } // Max price change % per tick
});
module.exports = mongoose.model('Stock', stockSchema);
`);

// Command: Business
fs.writeFileSync(path.join(commandsDir, 'business.js'), `
const User = require('../models/User');
const Business = require('../models/Business');

const BIZ_CONFIG = {
  'Mine': { cost: 5000, baseIncome: 100, collectInterval: 1 * 60 * 60 * 1000 }, // 1 hr
  'Factory': { cost: 20000, baseIncome: 600, collectInterval: 3 * 60 * 60 * 1000 }, // 3 hr
  'Bank': { cost: 100000, baseIncome: 5000, collectInterval: 12 * 60 * 60 * 1000 }, // 12 hr
  'Casino': { cost: 250000, baseIncome: 15000, collectInterval: 24 * 60 * 60 * 1000, risk: true } // 24 hr
};

module.exports = {
  data: {
    name: 'business',
    description: 'Capitalism awaits. Buy, upgrade, and collect from your businesses.',
    options: [
      {
        name: 'buy',
        description: 'Buy a new business',
        type: 1,
        options: [
          {
            name: 'type',
            description: 'Type of business',
            type: 3,
            required: true,
            choices: Object.keys(BIZ_CONFIG).map(k => ({ name: k + \` (🪙\${BIZ_CONFIG[k].cost})\`, value: k }))
          }
        ]
      },
      {
        name: 'collect',
        description: 'Collect passive revenue from your businesses',
        type: 1
      },
      {
        name: 'list',
        description: 'View your owned businesses',
        type: 1
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;

    if (sub === 'buy') {
      const type = interaction.options.getString('type');
      const config = BIZ_CONFIG[type];

      const user = await User.findOne({ discordId });
      if (!user || user.wallet < config.cost) {
        return interaction.reply({ content: \`You are too broke. You need 🪙**\${config.cost.toLocaleString()}** to buy a \${type}.\`, ephemeral: true });
      }

      await User.updateOne({ discordId }, { $inc: { wallet: -config.cost } });
      await new Business({ ownerId: discordId, type }).save();

      return interaction.reply(\`📈 Congratulations! You are now the proud owner of a **\${type}**! Use \`/business collect\` to claim revenue.\`);
    }

    if (sub === 'list') {
      const businesses = await Business.find({ ownerId: discordId });
      if (businesses.length === 0) return interaction.reply({ content: "You own nothing. Go buy a business first.", ephemeral: true });

      let desc = \`🏢 **Your Empire:**\\n\\n\`;
      businesses.forEach((b, i) => {
        desc += \`**\${i+1}. \${b.type} (Lvl \${b.level})**\\n\`;
      });
      return interaction.reply(desc);
    }

    if (sub === 'collect') {
      const businesses = await Business.find({ ownerId: discordId });
      if (businesses.length === 0) return interaction.reply({ content: "You don't own any businesses to collect from.", ephemeral: true });

      let totalCollected = 0;
      let msg = \`💰 **Revenue Collection Report:**\\n\\n\`;
      const now = Date.now();

      for (const b of businesses) {
        const config = BIZ_CONFIG[b.type];
        if (now - b.lastCollected >= config.collectInterval) {
          let income = config.baseIncome * b.level;
          
          if (config.risk) {
            // Casino can lose money
            if (Math.random() > 0.6) {
              income = -Math.floor(income / 2);
              msg += \`🎰 \${b.type}: **Lost** 🪙\${Math.abs(income)}\\n\`;
            } else {
              income = Math.floor(income * 1.5);
              msg += \`🎰 \${b.type}: **Jackpot!** 🪙\${income}\\n\`;
            }
          } else {
            msg += \`🏢 \${b.type}: +🪙\${income}\\n\`;
          }

          totalCollected += income;
          b.lastCollected = now;
          await b.save();
        } else {
          const timeLeft = Math.floor((config.collectInterval - (now - b.lastCollected)) / 60000);
          msg += \`⏳ \${b.type}: \${timeLeft} mins remaining.\\n\`;
        }
      }

      if (totalCollected !== 0) {
        await User.updateOne({ discordId }, { $inc: { wallet: totalCollected } });
      }

      return interaction.reply(msg + \`\\n**Net Change:** 🪙\${totalCollected}\`);
    }
  }
};
`);

// Command: Stock
fs.writeFileSync(path.join(commandsDir, 'stock.js'), `
const User = require('../models/User');
const Stock = require('../models/Stock');

module.exports = {
  data: {
    name: 'stock',
    description: 'Wall Street in the GhostVerse. Trade stocks.',
    options: [
      {
        name: 'view',
        description: 'View the live stock market prices',
        type: 1
      },
      {
        name: 'buy',
        description: 'Buy shares of a company',
        type: 1,
        options: [
          { name: 'company', description: 'Company Name', type: 3, required: true, choices: [
              {name: 'ShadowCorp', value: 'ShadowCorp'}, {name: 'FrostTech', value: 'FrostTech'},
              {name: 'CrimsonArms', value: 'CrimsonArms'}, {name: 'NeonMedia', value: 'NeonMedia'},
              {name: 'LostAirlines', value: 'LostAirlines'}
          ] },
          { name: 'amount', description: 'Number of shares', type: 4, required: true }
        ]
      },
      {
        name: 'sell',
        description: 'Sell your shares',
        type: 1,
        options: [
          { name: 'company', description: 'Company Name', type: 3, required: true, choices: [
              {name: 'ShadowCorp', value: 'ShadowCorp'}, {name: 'FrostTech', value: 'FrostTech'},
              {name: 'CrimsonArms', value: 'CrimsonArms'}, {name: 'NeonMedia', value: 'NeonMedia'},
              {name: 'LostAirlines', value: 'LostAirlines'}
          ] },
          { name: 'amount', description: 'Number of shares', type: 4, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;

    if (sub === 'view') {
      const stocks = await Stock.find();
      let desc = \`📈 **GhostVerse Stock Exchange (GVSE)** 📉\\n\\n\`;
      stocks.forEach(s => {
        const icon = s.trend === 'BULL' ? '🟢 📈' : s.trend === 'BEAR' ? '🔴 📉' : '🟡 ➖';
        desc += \`\${icon} **\${s.name}**: 🪙\${Math.floor(s.price)}\\n\`;
      });
      return interaction.reply(desc);
    }

    const company = interaction.options.getString('company');
    const amount = interaction.options.getInteger('amount');
    
    if (amount <= 0) return interaction.reply({ content: "Invalid amount.", ephemeral: true });

    const stock = await Stock.findOne({ name: company });
    if (!stock) return interaction.reply({ content: "Company not found.", ephemeral: true });
    
    const cost = Math.floor(stock.price * amount);

    let user = await User.findOne({ discordId });
    if (!user) return interaction.reply({ content: "You don't exist in the database.", ephemeral: true });

    if (!user.portfolio) user.portfolio = {};

    if (sub === 'buy') {
      if (user.wallet < cost) return interaction.reply({ content: \`You need 🪙**\${cost.toLocaleString()}** to buy \${amount} shares of \${company}.\`, ephemeral: true });
      
      user.wallet -= cost;
      user.portfolio[company] = (user.portfolio[company] || 0) + amount;
      
      // Mongoose mixed type markModified
      user.markModified('portfolio');
      await user.save();
      
      return interaction.reply(\`📈 You successfully bought **\${amount} shares** of **\${company}** for 🪙\${cost.toLocaleString()}.\`);
    }

    if (sub === 'sell') {
      const owned = user.portfolio[company] || 0;
      if (owned < amount) return interaction.reply({ content: \`You only own \${owned} shares of \${company}.\`, ephemeral: true });
      
      user.wallet += cost;
      user.portfolio[company] -= amount;
      if (user.portfolio[company] <= 0) delete user.portfolio[company];
      
      user.markModified('portfolio');
      await user.save();
      
      return interaction.reply(\`📉 You successfully sold **\${amount} shares** of **\${company}** for 🪙\${cost.toLocaleString()}.\`);
    }
  }
};
`);

// Event: voiceStateUpdate
fs.writeFileSync(path.join(eventsDir, 'voiceStateUpdate.js'), `
const User = require('../models/User');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    if (newState.member.user.bot) return;
    const userId = newState.member.user.id;

    // Joined VC and unmuted
    if (!oldState.channelId && newState.channelId && !newState.mute) {
      if (client.redis) {
        await client.redis.set(\`vc_join_\${userId}\`, Date.now());
      }
    }

    // Left VC or muted
    if ((oldState.channelId && !newState.channelId) || (!oldState.mute && newState.mute)) {
      if (client.redis) {
        const joinTimeStr = await client.redis.get(\`vc_join_\${userId}\`);
        if (joinTimeStr) {
          const joinTime = parseInt(joinTimeStr);
          const minutesSpent = Math.floor((Date.now() - joinTime) / 60000);
          
          if (minutesSpent > 0) {
            const coinsEarned = minutesSpent * 10; // 10 coins per minute
            await User.findOneAndUpdate(
              { discordId: userId },
              { $inc: { wallet: coinsEarned } },
              { upsert: true }
            ).catch(()=>{});
          }
          await client.redis.del(\`vc_join_\${userId}\`);
        }
      }
    }
  }
};
`);

// System: Stock Market
fs.writeFileSync(path.join(systemsDir, 'stockMarket.js'), `
const cron = require('node-cron');
const Stock = require('../models/Stock');

module.exports = (client) => {
  // Run every hour to fluctuate prices
  cron.schedule('0 * * * *', async () => {
    try {
      const stocks = await Stock.find();
      for (const s of stocks) {
        // 5% chance to change trend
        if (Math.random() < 0.05) {
          const trends = ['BULL', 'BEAR', 'STABLE'];
          s.trend = trends[Math.floor(Math.random() * trends.length)];
        }

        let changePercent = (Math.random() * s.volatility);
        if (s.trend === 'BULL') changePercent = Math.abs(changePercent);
        else if (s.trend === 'BEAR') changePercent = -Math.abs(changePercent);
        else changePercent = (Math.random() > 0.5 ? 1 : -1) * (changePercent / 2); // Stable fluctuates slightly

        s.price = s.price * (1 + (changePercent / 100));
        
        // Hard limits so economy doesn't break entirely
        if (s.price < 5) s.price = 5;
        if (s.price > 50000) s.price = 50000;

        await s.save();
      }
      console.log("Stock Market prices updated.");
    } catch(e) { console.error("StockMarket error:", e) }
  });
};
`);

// System: Disasters
fs.writeFileSync(path.join(systemsDir, 'disasters.js'), `
const cron = require('node-cron');
const Stock = require('../models/Stock');

module.exports = (client) => {
  // Run once a day at noon
  cron.schedule('0 12 * * *', async () => {
    try {
      if (Math.random() > 0.2) return; // 20% chance of a disaster/boom each day

      const isBoom = Math.random() > 0.5;
      const stocks = await Stock.find();
      if (stocks.length === 0) return;

      const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
      
      let msg = "";
      if (isBoom) {
        randomStock.price *= 2; // Price doubles
        randomStock.trend = 'BULL';
        msg = \`🚀 **ECONOMIC BOOM!** \${randomStock.name} just secured a massive government contract. Stock prices have DOUBLED!\`;
      } else {
        randomStock.price *= 0.5; // Price halves
        randomStock.trend = 'BEAR';
        msg = \`📉 **DISASTER STRUCK!** A massive scandal has hit \${randomStock.name}. Stock prices have HALVED!\`;
      }

      await randomStock.save();

      // Broadcast to channels
      const guilds = Array.from(client.guilds.cache.values());
      for (const guild of guilds) {
        const textChannels = Array.from(guild.channels.cache.filter(c => c.type === 0).values());
        if (textChannels.length > 0) {
          const randomChannel = textChannels[Math.floor(Math.random() * textChannels.length)];
          await randomChannel.send(msg).catch(() => {});
        }
      }
    } catch(e) { console.error("Disasters error:", e) }
  });
};
`);

// Rewrite profile.js to include Portfolio and Business count
fs.writeFileSync(path.join(commandsDir, 'profile.js'), `
const User = require('../models/User');
const Business = require('../models/Business');

module.exports = {
  data: {
    name: 'profile',
    description: 'View your GhostVerse profile and net worth.',
    options: [
      { name: 'user', description: 'View someone else\\'s profile', type: 6, required: false }
    ]
  },
  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    let userRecord = await User.findOne({ discordId: targetUser.id });
    if (!userRecord) {
      return interaction.reply({ content: "This user hasn't stepped into the GhostVerse yet.", ephemeral: true });
    }

    const bizCount = await Business.countDocuments({ ownerId: targetUser.id });
    
    let portfolioStr = "";
    if (userRecord.portfolio) {
      for (const [company, shares] of Object.entries(userRecord.portfolio)) {
        portfolioStr += \`\${company}: \${shares} shares\\n\`;
      }
    }
    if (portfolioStr === "") portfolioStr = "No investments.";

    const embed = {
      color: 0x2b2d31,
      title: \`\${targetUser.username}'s Profile\`,
      thumbnail: { url: targetUser.displayAvatarURL() },
      fields: [
        { name: 'Nation', value: userRecord.nation, inline: true },
        { name: 'Role', value: userRecord.role, inline: true },
        { name: 'Businesses', value: \`🏢 \${bizCount}\`, inline: true },
        { name: 'Ghost Coins', value: \`🪙 \${userRecord.wallet.toLocaleString()}\`, inline: false },
        { name: 'Stock Portfolio', value: portfolioStr, inline: false },
      ]
    };

    await interaction.reply({ embeds: [embed] });
  }
};
`);

console.log("Phase 3 generated.");
