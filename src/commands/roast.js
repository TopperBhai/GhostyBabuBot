module.exports = {
  data: {
    name: 'roast',
    description: 'Tag a user and Ghosty Babu will brutally roast them in Hinglish.',
    options: [
  {
    "name": "user",
    "description": "The person you want to roast",
    "type": 6,
    "required": true
  }
]
  },
  async execute(interaction, client) {
    await require('../handlers/personaHandler')(interaction, client, 'roast');
  }
};