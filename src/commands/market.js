const Market = require('../models/Market');
const Business = require('../models/Business');
const User = require('../models/User');
const State = require('../models/State');

module.exports = {
  data: {
    name: 'market',
    description: 'GhostVerse Global Market',
    options: [
      {
        name: 'view',
        description: 'View the global commodity prices.',
        type: 1
      },
      {
        name: 'sell',
        description: 'Sell a business inventory to the Global Market.',
        type: 1,
        options: [
          { name: 'business_index', description: 'Index of your business (/business list)', type: 4, required: true },
          { name: 'commodity', description: 'What to sell', type: 3, required: true, choices: [
            { name: 'Food', value: 'Food' },
            { name: 'Ore', value: 'Ore' },
            { name: 'Goods', value: 'Goods' },
            { name: 'Meals', value: 'Meals' }
          ]},
          { name: 'amount', description: 'How much to sell', type: 4, required: true }
        ]
      },
      {
        name: 'buy',
        description: 'Buy raw materials from the Global Market for your business.',
        type: 1,
        options: [
          { name: 'business_index', description: 'Index of your business', type: 4, required: true },
          { name: 'commodity', description: 'What to buy', type: 3, required: true, choices: [
            { name: 'Food', value: 'Food' },
            { name: 'Ore', value: 'Ore' }
          ]},
          { name: 'amount', description: 'How much to buy', type: 4, required: true }
        ]
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    
    if (sub === 'view') {
      const markets = await Market.find();
      
      let desc = "**Global Commodity Prices (Supply & Demand)**\n\n";
      for (const m of markets) {
        let icon = m.commodity === 'Food' ? '🍞' : m.commodity === 'Ore' ? '🪨' : m.commodity === 'Goods' ? '📦' : '🍔';
        desc += `${icon} **${m.commodity}** — 🪙 **${m.price.toLocaleString()}**\n`;
        desc += `└ \`Supply: ${m.supply.toLocaleString()} | Demand: ${m.demand.toLocaleString()}\`\n\n`;
      }

      const embed = {
        color: 0x3498db,
        title: "🌍 GhostVerse Global Market 🌍",
        description: desc.trim(),
        footer: { text: "Use /market buy or /market sell to trade" },
        timestamp: new Date().toISOString()
      };

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'sell') {
      const discordId = interaction.user.id;
      const index = interaction.options.getInteger('business_index') - 1;
      const commodity = interaction.options.getString('commodity');
      const amount = interaction.options.getInteger('amount');

      if (amount <= 0) return interaction.reply({ content: "Amount must be greater than 0.", ephemeral: true });

      const businesses = await Business.find({ ownerId: discordId });
      if (index < 0 || index >= businesses.length) return interaction.reply({ content: "Invalid business index.", ephemeral: true });

      const biz = businesses[index];
      
      // Mongoose Object manipulation
      let inv = biz.inventory || {};
      if (!inv[commodity] || inv[commodity] < amount) {
        return interaction.reply({ content: `Your business does not have ${amount} ${commodity}. Current stock: ${inv[commodity] || 0}`, ephemeral: true });
      }

      // Process Sale
      const market = await Market.findOne({ commodity });
      if (!market) return interaction.reply({ content: "Market error.", ephemeral: true });

      const revenue = market.price * amount;

      // Update Market
      market.supply += amount;
      // Price drops slightly due to increased supply (Law of Demand)
      market.price = Math.max(1, Math.floor(market.price * 0.99));
      await market.save();

      // Update Business Inventory
      inv[commodity] -= amount;
      biz.inventory = inv;
      biz.markModified('inventory');
      await biz.save();

      // Give Player Money (after Taxes)
      let state = await State.findOne({ id: 'GLOBAL' });
      if (!state) state = await new State({ id: 'GLOBAL' }).save();
      const taxRate = state.taxRate || 0.10;
      const taxesDue = Math.floor(revenue * taxRate);
      const netRevenue = revenue - taxesDue;

      state.treasury += taxesDue;
      await state.save();

      await User.updateOne({ discordId }, { $inc: { wallet: netRevenue } });

      return interaction.reply(`📈 You sold **${amount} ${commodity}** to the Global Market for **🪙${revenue.toLocaleString()}**!\nFederal Tax (${(taxRate*100).toFixed(0)}%): -🪙${taxesDue.toLocaleString()}`);
    }

    if (sub === 'buy') {
      const discordId = interaction.user.id;
      const index = interaction.options.getInteger('business_index') - 1;
      const commodity = interaction.options.getString('commodity');
      const amount = interaction.options.getInteger('amount');

      if (amount <= 0) return interaction.reply({ content: "Amount must be greater than 0.", ephemeral: true });

      const businesses = await Business.find({ ownerId: discordId });
      if (index < 0 || index >= businesses.length) return interaction.reply({ content: "Invalid business index.", ephemeral: true });

      const biz = businesses[index];
      const market = await Market.findOne({ commodity });
      if (!market) return interaction.reply({ content: "Market error.", ephemeral: true });

      if (market.supply < amount) {
        return interaction.reply({ content: `The Global Market only has ${market.supply} ${commodity} in stock.`, ephemeral: true });
      }

      const cost = market.price * amount;

      const user = await User.findOne({ discordId });
      if (!user || user.wallet < cost) {
        return interaction.reply({ content: `You need 🪙${cost.toLocaleString()} to buy ${amount} ${commodity}.`, ephemeral: true });
      }

      // Process Purchase
      user.wallet -= cost;
      await user.save();

      market.supply -= amount;
      market.price = Math.floor(market.price * 1.01); // Price increases slightly
      await market.save();

      let inv = biz.inventory || {};
      inv[commodity] = (inv[commodity] || 0) + amount;
      biz.inventory = inv;
      biz.markModified('inventory');
      await biz.save();

      return interaction.reply(`🛒 You bought **${amount} ${commodity}** from the Global Market for **🪙${cost.toLocaleString()}** for your ${biz.customName || biz.type}!`);
    }
  }
};
