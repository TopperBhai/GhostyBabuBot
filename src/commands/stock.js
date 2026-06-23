
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
              {name: 'Microhard', value: 'Microhard'}, {name: 'Tasla', value: 'Tasla'},
              {name: 'Space Y', value: 'Space Y'}, {name: 'Boogle', value: 'Boogle'},
              {name: 'Beta', value: 'Beta'}, {name: 'HitCoin', value: 'HitCoin'},
              {name: 'Pintel', value: 'Pintel'}, {name: 'WhiteRock', value: 'WhiteRock'},
              {name: 'AmmaZone', value: 'AmmaZone'}
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
              {name: 'Microhard', value: 'Microhard'}, {name: 'Tasla', value: 'Tasla'},
              {name: 'Space Y', value: 'Space Y'}, {name: 'Boogle', value: 'Boogle'},
              {name: 'Beta', value: 'Beta'}, {name: 'HitCoin', value: 'HitCoin'},
              {name: 'Pintel', value: 'Pintel'}, {name: 'WhiteRock', value: 'WhiteRock'},
              {name: 'AmmaZone', value: 'AmmaZone'}
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
      
      let desc = "**Prices fluctuate every 5 minutes. Buy low, sell high!**\n\n";
      
      stocks.forEach(s => {
        let prev = s.previousPrice || s.price;
        let diff = s.price - prev;
        let percent = prev > 0 ? (diff / prev) * 100 : 0;
        let percentStr = percent >= 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`;
        
        let icon = '🟡';
        let arrow = '➖';
        if (s.trend === 'BULL') { icon = '🟢'; arrow = '▲'; }
        if (s.trend === 'BEAR') { icon = '🔴'; arrow = '▼'; }

        // Clean line-by-line format: 🟢 **ShadowCorp** — 🪙 100 (▲ +0.95%)
        desc += `${icon} **${s.name}** — 🪙 **${Math.floor(s.price).toLocaleString()}** \`(${arrow} ${percentStr})\`\n`;
      });

      const embed = {
        color: 0x2b2d31,
        title: "📈 GhostVerse Stock Exchange (GVSE) 📉",
        description: desc,
        footer: { text: "Use /stock buy or /stock sell" },
        timestamp: new Date().toISOString()
      };

      return interaction.reply({ embeds: [embed] });
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
      if (user.wallet < cost) return interaction.reply({ content: `You need 🪙**${cost.toLocaleString()}** to buy ${amount} shares of ${company}.`, ephemeral: true });
      
      let currentHolding = user.portfolio[company];
      // Backwards compatibility check
      if (typeof currentHolding === 'number') {
        currentHolding = { amount: currentHolding, avgCost: 0 };
      }
      if (!currentHolding) currentHolding = { amount: 0, avgCost: 0 };

      // Calculate new Average Cost
      let oldTotalCost = currentHolding.amount * currentHolding.avgCost;
      let newTotalCost = oldTotalCost + cost;
      let newAmount = currentHolding.amount + amount;
      let newAvgCost = newTotalCost / newAmount;

      user.wallet -= cost;
      user.portfolio[company] = { amount: newAmount, avgCost: newAvgCost };
      
      // Mongoose mixed type markModified
      user.markModified('portfolio');
      await user.save();
      
      return interaction.reply(`📈 You successfully bought **${amount} shares** of **${company}** for 🪙${cost.toLocaleString()}.\n\`Average Cost: 🪙${Math.floor(newAvgCost).toLocaleString()}/share\``);
    }

    if (sub === 'sell') {
      let currentHolding = user.portfolio[company];
      if (typeof currentHolding === 'number') {
        currentHolding = { amount: currentHolding, avgCost: 0 };
      }

      const owned = currentHolding ? currentHolding.amount : 0;
      if (owned < amount) return interaction.reply({ content: `You only own ${owned} shares of ${company}.`, ephemeral: true });
      
      // Calculate Profit / Loss
      let avgCost = currentHolding.avgCost || 0;
      let costBasis = avgCost * amount;
      let profit = cost - costBasis;
      let profitPercent = avgCost > 0 ? (profit / costBasis) * 100 : 0;
      
      let indicator = profit >= 0 ? '🟢 **PROFIT**' : '🔴 **LOSS**';
      let percentStr = profitPercent >= 0 ? `+${profitPercent.toFixed(2)}%` : `${profitPercent.toFixed(2)}%`;

      user.wallet += cost;
      currentHolding.amount -= amount;
      
      if (currentHolding.amount <= 0) {
        delete user.portfolio[company];
      } else {
        user.portfolio[company] = currentHolding;
      }
      
      user.markModified('portfolio');
      await user.save();
      
      const embed = {
        color: profit >= 0 ? 0x00ff00 : 0xff0000,
        description: `📉 You successfully sold **${amount} shares** of **${company}** for **🪙${cost.toLocaleString()}**.\n\n${indicator}: \`🪙${profit > 0 ? '+' : ''}${Math.floor(profit).toLocaleString()}\` (${percentStr})`
      };

      return interaction.reply({ embeds: [embed] });
    }
  }
};
