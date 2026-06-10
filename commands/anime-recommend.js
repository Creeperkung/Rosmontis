const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("recommendanime")
        .setDescription("Get a anime recommendation"),

    async execute(interaction) {
        console.log("Executing anime random");

        try {
            const response = await fetch(
                `https://api.jikan.moe/v4/recommendations/anime`
            );
            console.log("API response received");
            
            const data = await response.json();
            const recommendations = data.data;
            const random = recommendations[Math.floor(Math.random() * recommendations.length)];
            const anime1 = random.entry[0];

            const response2 = await fetch(
                `https://api.jikan.moe/v4/anime?q=${anime1.title}&limit=1`
            );
            const data2 = await response2.json();
            const anime = data2.data[0];
            console.log(anime);
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