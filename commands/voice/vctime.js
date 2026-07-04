const { SlashCommandBuilder } = require('discord.js');
const db = require('../../db');

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vctime')
    .setDescription('Check total voice channel time for a user')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to check (defaults to yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    const total = db.getTotalTime(interaction.guildId, targetUser.id);

    if (total === 0) {
      return interaction.reply(`${targetUser} hasn't spent any tracked time in voice channels yet.`);
    }

    await interaction.reply(`🎙️ ${targetUser} has spent **${formatDuration(total)}** in voice channels.`);
  }
};