module.exports = {
  data: {
    name: 'flirt',
    description: 'Tag a user and Ghosty Babu will flirt with them in Hinglish.',
    options: [
  {
    "name": "user",
    "description": "The person you want to flirt with",
    "type": 6,
    "required": true
  }
]
  },
  async execute(interaction, client) {
    await require('../../handlers/personaHandler')(interaction, client, 'flirt');
  }
};