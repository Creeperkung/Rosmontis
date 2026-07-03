const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("topanime")
        .setDescription("Show the top 10 anime"),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch(
                "https://api.jikan.moe/v4/top/anime?limit=10"
            );

            const data = await response.json();

            const animeList = data.data
                .map((anime, index) =>
                    `${index + 1}. [${anime.title}](${anime.url}) ⭐ ${anime.score ?? "N/A"}`
                )
                .join("\n");

            const embed = new EmbedBuilder()
                .setTitle("🏆 Top 10 Anime")
                .setDescription(animeList);

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error(error);

            await interaction.editReply(
                "Failed to get top anime."
            );
        }
    }
};