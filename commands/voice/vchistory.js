const { SlashCommandBuilder } = require('discord.js');
const db = require('../../db');

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vchistory')
    .setDescription('Show recent voice channel sessions for a user')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to check (defaults to yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    const rows = db.getHistory(interaction.guildId, targetUser.id, 10);

    if (rows.length === 0) {
      return interaction.reply(`${targetUser} has no recorded voice sessions yet.`);
    }

    const lines = rows.map(row => {
        const joined = `<t:${row.joined_at}:t>`;
        const left = row.left_at ? `<t:${row.left_at}:t>` : '**still in call**';
        const duration = formatDuration(row.duration_seconds);
        return `**<#${row.channel_id}>** — ${joined} → ${left} (${duration})`;
        });

    await interaction.reply({
      embeds: [{
        title: `🕒 Recent Voice Sessions — ${targetUser.username}`,
        description: lines.join('\n'),
        color: 0x5865f2
      }]
    });
  }
};