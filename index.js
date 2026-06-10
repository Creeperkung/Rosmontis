require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Collection
} = require("discord.js");

const animeSearch = require("./commands/anime-search");
const randomAnime = require("./commands/anime-random");
const topAnime = require("./commands/anime-top");
const animeRecommend = require('./commands/anime-recommend');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();


client.commands.set(
    randomAnime.data.name,
    randomAnime
);
client.commands.set(
    animeSearch.data.name,
    animeSearch
);
client.commands.set(
    topAnime.data.name,
    topAnime
);
client.commands.set(
    animeRecommend.data.name,
    animeRecommend
);

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
    console.log("Interaction received:", interaction.commandName);

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.log("Command not found");
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error("Command error:", error);
    }
});
console.log(client.commands.map(cmd => cmd.data.name));
client.login(process.env.DISCORD_TOKEN);