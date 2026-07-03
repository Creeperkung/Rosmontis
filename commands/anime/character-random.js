const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("randomcharacter")
        .setDescription("Get a random anime character"),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch(
                "https://api.jikan.moe/v4/random/characters"
            );

            const { data } = await response.json();

            const anime =
                data.anime?.[0]?.role
                    ? data.anime[0]
                    : null;

            const embed = new EmbedBuilder()
                .setTitle(data.name)
                .setURL(data.url)
                .setThumbnail(data.images.jpg.image_url)
                .setDescription(
                    data.about
                        ? data.about.substring(0, 500) + "..."
                        : "No description available."
                );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply(
                "Failed to get a random character."
            );
        }
    },
};