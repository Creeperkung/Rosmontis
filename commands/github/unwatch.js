const { SlashCommandBuilder } = require('discord.js');
const { deleteWebhook } = require('../../github');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwatch')
    .setDescription('Stop watching a GitHub repo')
    .addStringOption(opt => opt.setName('repo').setDescription('owner/repo').setRequired(true)),

  async execute(interaction) {
    const [owner, repo] = interaction.options.getString('repo').split('/');
    const entry = db.getRepo(owner, repo);

    if (!entry) {
      return interaction.reply({ content: 'Not watching that repo.', ephemeral: true });
    }

    await deleteWebhook(owner, repo, entry.hook_id);
    db.removeRepo(owner, repo);

    await interaction.reply(`🗑️ Stopped watching **${owner}/${repo}**`);
  }
};