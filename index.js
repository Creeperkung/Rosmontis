require('dotenv').config();
const path = require("path");
const fs = require('fs');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const setupWebhook = require('./webhook');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});
client.login(process.env.DISCORD_TOKEN);

client.commands = new Collection();

const commandData = [];
const commandsPath = path.join(__dirname, 'commands');

// Get each category folder: github, gps, anime
const categoryFolders = fs.readdirSync(commandsPath).filter(f =>
  fs.statSync(path.join(commandsPath, f)).isDirectory()
);

for (const category of categoryFolders) {
  const categoryPath = path.join(commandsPath, category);
  const commandFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(categoryPath, file));

    if (!command.data || !command.execute) {
      console.warn(`⚠️  Skipping ${category}/${file} — missing data or execute`);
      continue;
    }

    client.commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
    console.log(`Loaded /${command.data.name} from ${category}/`);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commandData }
  );

  setupWebhook(client);
});

client.on("interactionCreate", async interaction => {
    console.log("Interaction received:", interaction.commandName);

    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      const reply = { content: '❌ เกิดข้อผิดพลาด ลองใหม่อีกครั้ง', flags: 64 };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }

    if (interaction.isButton()) {
    if (interaction.customId.startsWith('refresh_weather_')) {
      const city = interaction.customId.replace('refresh_weather_', '');
      const weatherCommand = client.commands.get('weather');
      await weatherCommand.handleRefresh(interaction, city);
    }
    if (interaction.customId.startsWith('map_zoom')) {
      const mapCommand = client.commands.get('map');
      await mapCommand.handleButton(interaction, interaction.customId);
    }
    if (interaction.customId.startsWith('forecast_btn_')) {
      const city = interaction.customId.replace('forecast_btn_', '');
      const forecastCommand = client.commands.get('forecast');
      await forecastCommand.handleRefresh(interaction, city);
    }
  }
});
// console.log(client.commands.map(cmd => cmd.data.name));

