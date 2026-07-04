const { SlashCommandBuilder } = require('discord.js');
const db = require('../../db');

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vcleaderboard')
    .setDescription('Show the top voice channel users in this server'),

  async execute(interaction) {
    const rows = db.getLeaderboard(interaction.guildId, 10);

    if (rows.length === 0) {
      return interaction.reply('No voice activity has been tracked yet.');
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = rows.map((row, i) => {
      const prefix = medals[i] || `${i + 1}.`;
      return `${prefix} <@${row.user_id}> — **${formatDuration(row.total)}**`;
    });

    await interaction.reply({
      embeds: [{
        title: '🎙️ Voice Channel Leaderboard',
        description: lines.join('\n'),
        color: 0x5865f2
      }]
    });
  }
};