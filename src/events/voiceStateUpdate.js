
const User = require('../models/User');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    if (newState.member.user.bot) return;
    const userId = newState.member.user.id;

    // Joined VC and unmuted
    if (!oldState.channelId && newState.channelId && !newState.mute) {
      if (client.redis) {
        await client.redis.set(`vc_join_${userId}`, Date.now());
      }
    }

    // Left VC or muted
    if ((oldState.channelId && !newState.channelId) || (!oldState.mute && newState.mute)) {
      if (client.redis) {
        const joinTimeStr = await client.redis.get(`vc_join_${userId}`);
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
          await client.redis.del(`vc_join_${userId}`);
        }
      }
    }
  }
};
