module.exports = {
  channel: process.env.CHANNEL,
  admin: process.env.ADMIN,
  scanRate: 10000,
  dequeueAtBuffer: 5000,
  youtubeKey: process.env.YOUTUBE_KEY,
  twitchClientID: process.env.TWITCH_CLIENT_ID,
  twitchSecret: process.env.TWITCH_SECRET,
};
