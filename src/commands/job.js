const User = require('../models/User');

const JOBS = [
  { title: 'Taxi Driver', salary: 100, type: 'Legal', req: 'None' },
  { title: 'Police Officer', salary: 300, type: 'Legal', req: 'None' },
  { title: 'Doctor', salary: 800, type: 'Legal', req: 'None' },
  { title: 'Journalist', salary: 400, type: 'Legal', req: 'None' },
  { title: 'Drug Dealer', salary: 500, type: 'Illegal', req: 'None' },
  { title: 'Smuggler', salary: 1200, type: 'Illegal', req: 'None' },
  { title: 'Assassin', salary: 2500, type: 'Illegal', req: 'None' } // High risk
];

module.exports = {
  data: {
    name: 'job',
    description: 'Manage your employment in the GhostVerse.',
    options: [
      {
        name: 'list',
        description: 'View all available jobs in the city.',
        type: 1
      },
      {
        name: 'apply',
        description: 'Apply for a state-sponsored job.',
        type: 1,
        options: [
          { name: 'title', description: 'Exact title of the job', type: 3, required: true }
        ]
      },
      {
        name: 'resign',
        description: 'Quit your current job.',
        type: 1
      }
    ]
  },
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });

    if (!user) return interaction.reply({ content: "You don't exist.", ephemeral: true });

    if (sub === 'list') {
      let msg = "🏢 **GhostVerse Employment Office** 🏢\n\n";
      JOBS.forEach(j => {
        msg += `**${j.title}** (${j.type}) - 🪙${j.salary}/hour\n`;
      });
      return interaction.reply({ content: msg });
    }

    if (sub === 'apply') {
      const title = interaction.options.getString('title');
      const job = JOBS.find(j => j.title.toLowerCase() === title.toLowerCase());

      if (!job) return interaction.reply({ content: "That job does not exist. Check `/job list`.", ephemeral: true });
      if (user.jobTitle === job.title) return interaction.reply({ content: "You already have this job.", ephemeral: true });
      if (user.employerId !== 'None' && user.employerId !== 'State') {
         return interaction.reply({ content: "You are currently employed by a Player Company. You must resign first.", ephemeral: true });
      }

      user.jobTitle = job.title;
      user.jobSalary = job.salary;
      user.employerId = 'State';
      await user.save();

      return interaction.reply(`🎉 Congratulations <@${discordId}>! You are now employed as a **${job.title}** earning 🪙${job.salary}/hour.`);
    }

    if (sub === 'resign') {
      if (user.jobTitle === 'Unemployed') {
        return interaction.reply({ content: "You don't have a job to quit.", ephemeral: true });
      }

      const oldJob = user.jobTitle;
      user.jobTitle = 'Unemployed';
      user.jobSalary = 0;
      user.employerId = 'None';
      await user.save();

      return interaction.reply(`👋 <@${discordId}> has resigned from their position as a **${oldJob}**.`);
    }
  }
};
