module.exports = {
  data: {
    name: 'bhavishyavani',
    description: 'Ask Ghosty Babu a question about your future.',
    options: [
  {
    "name": "question",
    "description": "The question you want to ask",
    "type": 3,
    "required": true
  }
]
  },
  async execute(interaction, client) {
    await require('../handlers/personaHandler')(interaction, client, 'bhavishyavani');
  }
};