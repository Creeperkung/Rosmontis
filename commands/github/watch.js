const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { createWebhook } = require('../../github');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('watch')
    .setDescription('Watch a GitHub repo for updates')
    .addStringOption(opt => opt.setName('repo').setDescription('owner/repo').setRequired(true))
    .addChannelOption(opt => opt.setName('channel').setDescription('channel to post to').addChannelTypes(ChannelType.GuildText).setRequired(true)),

  async execute(interaction) {
    const [owner, repo] = interaction.options.getString('repo').split('/');
    const channel = interaction.options.getChannel('channel');

    if (!owner || !repo) {
      return interaction.reply({ content: 'Format must be `owner/repo`', ephemeral: true });
    }

    if (db.getRepo(owner, repo)) {
      return interaction.reply({ content: 'Already watching that repo.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const { hookId, secret } = await createWebhook(owner, repo);
      db.addRepo(interaction.guildId, channel.id, owner, repo, secret, hookId);
      await interaction.editReply(`✅ Now watching **${owner}/${repo}** → ${channel}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply(`❌ Failed to set up webhook. Check the repo name and your token permissions.`);
    }
  }
};