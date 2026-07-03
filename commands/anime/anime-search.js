const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anime")
        .setDescription("Search for an anime")
        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Anime name")
                .setRequired(true)
        ),

    async execute(interaction) {
        console.log("Executing anime search");
        const name = interaction.options.getString("name");

        try {
            const response = await fetch(
                `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(name)}&limit=1`
            );
            console.log("API response received");
            const data = await response.json();

            if (!data.data.length) {
                return interaction.reply("Anime not found.");
            }

            const anime = data.data[0];

            const embed = new EmbedBuilder()
                .setTitle(anime.title)
                .setURL(anime.url)
                .setDescription(anime.synopsis?.slice(0, 500) || "No synopsis")
                .setThumbnail(anime.images.jpg.image_url)
                .addFields(
                    { name: "Score", value: `${anime.score || "N/A"}`, inline: true },
                    { name: "Episodes", value: `${anime.episodes || "?"}`, inline: true },
                    { name: "Status", value: anime.status || "Unknown", inline: true }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply("Something went wrong.");
        }
    },
};