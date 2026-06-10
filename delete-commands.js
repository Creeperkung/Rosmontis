require("dotenv").config();
const { REST, Routes } = require("discord.js");
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
async function clearGuildCommands() {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: [] } // empty array = delete all guild commands
  );
  console.log('🗑️ Guild commands cleared.');
}
clearGuildCommands();