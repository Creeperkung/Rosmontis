const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("randomanime")
        .setDescription("Get a random anime recommendation"),

    async execute(interaction) {
        console.log("Executing anime random");

        try {
            const response = await fetch(
                `https://api.jikan.moe/v4/random/anime`
            );
            console.log("API response received");

            const data = await response.json();
            const anime = data.data;

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