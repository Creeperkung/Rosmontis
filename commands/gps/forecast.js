const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
//const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const weatherEmoji = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️',
};

function dayName(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' });
}

async function fetchForecast(city) {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;

        const url =
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=th&cnt=40`;

        console.log("Before fetch");

        const res = await fetch(url);

        console.log("After fetch");

        if (!res.ok) {
            throw new Error(`Status ${res.status}`);
        }

        return await res.json();

    } catch (err) {
        console.error("Fetch Error:", err);
        throw err;
    }
}

async function buildForecast(city) {
  const data = await fetchForecast(city);

  const { city: cityInfo, list } = data;
  const days = groupByDay(list);
  const dayKeys = Object.keys(days).slice(0, 5);

  const embed = new EmbedBuilder()
    .setTitle(`📅 พยากรณ์อากาศ 5 วัน — ${cityInfo.name}, ${cityInfo.country}`)
    .setColor(0x5865f2)
    .setDescription(`📍 ${cityInfo.coord.lat.toFixed(2)}, ${cityInfo.coord.lon.toFixed(2)}`)
    .setTimestamp()
    .setFooter({
      text: 'ข้อมูลจาก OpenWeatherMap | อัปเดตทุก 3 ชั่วโมง'
    });

  // for loop เดิมของคุณ
  for (const dateKey of dayKeys) {
            const items = days[dateKey];
        const temps = items.map(i => i.main.temp);
        const minT = Math.min(...temps).toFixed(1);
        const maxT = Math.max(...temps).toFixed(1);
        const avgHumidity = Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length);
        const maxRain = items.reduce((s, i) => s + (i.rain?.['3h'] || 0), 0).toFixed(1);
        const mainCond = items[Math.floor(items.length / 2)].weather[0].main;
        const desc     = items[Math.floor(items.length / 2)].weather[0].description;
        const emoji = weatherEmoji[mainCond] || '🌡️';

        // Build hourly mini-summary (3 time slots)
        const slots = items.filter((_, i) => i % 2 === 0).slice(0, 3);
        const hourly = slots.map(s => {
          const h = s.dt_txt.split(' ')[1].slice(0, 5);
          const e = weatherEmoji[s.weather[0].main] || '🌡️';
          return `\`${h}\` ${e} ${s.main.temp.toFixed(0)}°`;
        }).join('  ');

        embed.addFields({
          name: `${emoji} ${dayName(dateKey)}`,
          value: `🌡️ **${minT}° – ${maxT}°C** | 💧 ${avgHumidity}% | 🌧️ ${maxRain}mm\n${desc}\n${hourly}`,
          inline: false,
        });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🌐 ดูเพิ่มเติม')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://openweathermap.org/find?q=${encodeURIComponent(city)}`),

    new ButtonBuilder()
      .setCustomId(`refresh_weather_${city}`)
      .setLabel('☀️ ดูอากาศตอนนี้')
      .setStyle(ButtonStyle.Primary),
  );

  return { embed, row };
}

function groupByDay(list) {
  const days = {};
  for (const item of list) {
    const date = item.dt_txt.split(' ')[0];
    if (!days[date]) days[date] = [];
    days[date].push(item);
  }
  return days;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forecast')
    .setDescription('📅 พยากรณ์อากาศ 5 วัน แบบละเอียด')
    .addStringOption(opt =>
      opt.setName('city')
         .setDescription('ชื่อเมือง เช่น Bangkok, Phuket')
         .setRequired(true)
    ),

    async execute(interaction) {
        await interaction.deferReply();

        const city = interaction.options.getString('city');

        const { embed, row } =
            await buildForecast(city);

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    },
    async handleRefresh(interaction, city) {

        await interaction.deferUpdate();

        const { embed, row } =
            await buildForecast(city);

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    },
};