require("dotenv").config();

const { REST, Routes } = require("discord.js");
const animeSearch = require("./commands/anime-search");
const animeRandom = require("./commands/anime-random");
const animeTop = require("./commands/anime-top");
const animeRecommend = require("./commands/anime-recommend");

const commands = [
    animeSearch.data.toJSON(),
    animeRandom.data.toJSON(),
    animeTop.data.toJSON(),
    animeRecommend.data.toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);


async function deployAll() {
  try {
    console.log(commands.map(cmd => cmd.name));
    // Deploy guild commands (instant - for testing)
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Guild commands deployed instantly.');

    // Deploy global commands (up to 1 hour)
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Global commands deployed. Wait up to 1 hour.');

  } catch (err) {
    console.error(err);
  }
}

deployAll();