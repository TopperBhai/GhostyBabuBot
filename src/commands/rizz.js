module.exports = {
  data: {
    name: 'rizz',
    description: 'Tag a user and Ghosty Babu will rizz them up with Hinglish pickup lines.',
    options: [
  {
    "name": "user",
    "description": "The person you want to rizz up",
    "type": 6,
    "required": true
  }
]
  },
  async execute(interaction, client) {
    await require('../handlers/personaHandler')(interaction, client, 'rizz');
  }
};