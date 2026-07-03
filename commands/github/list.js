const { SlashCommandBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List watched GitHub repos'),

  async execute(interaction) {
    const repos = db.listRepos(interaction.guildId);
    if (repos.length === 0) {
      return interaction.reply('No repos are currently being watched.');
    }
    const list = repos.map(r => `• **${r.owner}/${r.repo}** → <#${r.channel_id}>`).join('\n');
    await interaction.reply(list);
  }
};