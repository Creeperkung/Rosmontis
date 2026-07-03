const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
//const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

// Weather condition → emoji mapping
const weatherEmoji = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️',
  Haze: '🌁', Smoke: '💨', Dust: '🌪️', Tornado: '🌪️',
};

// Wind direction helper
function windDir(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// UV index label
function uvLabel(uv) {
  if (uv <= 2) return '🟢 ต่ำ';
  if (uv <= 5) return '🟡 ปานกลาง';
  if (uv <= 7) return '🟠 สูง';
  if (uv <= 10) return '🔴 สูงมาก';
  return '🟣 อันตราย';
}

async function fetchWeather(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=th`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`City not found: ${city}`);
  return res.json();
}

async function buildWeatherEmbed(city) {
  const data = await fetchWeather(city);
  const { name, sys, main, weather, wind, visibility, clouds, coord } = data;

  const condition = weather[0].main;
  const emoji = weatherEmoji[condition] || '🌡️';
  const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
  const mapThumb = `https://static-maps.yandex.ru/1.x/?ll=${coord.lon},${coord.lat}&z=10&l=map&size=450,200`;

  // Temp color by heat
  let color = 0x00bfff;
  if (main.temp >= 35) color = 0xff4500;
  else if (main.temp >= 30) color = 0xff8c00;
  else if (main.temp >= 20) color = 0x32cd32;
  else if (main.temp >= 10) color = 0x1e90ff;
  else color = 0x87ceeb;

  const sunrise = new Date(sys.sunrise * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const sunset  = new Date(sys.sunset  * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const updated = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} สภาพอากาศ — ${name}, ${sys.country}`)
    .setDescription(`**${weather[0].description.toUpperCase()}**`)
    .setColor(color)
    .setThumbnail(iconUrl)
    .setImage(mapThumb)
    .addFields(
      { name: '🌡️ อุณหภูมิ', value: `**${main.temp.toFixed(1)}°C**\nรู้สึกเหมือน ${main.feels_like.toFixed(1)}°C`, inline: true },
      { name: '💧 ความชื้น', value: `**${main.humidity}%**\nจุดน้ำค้าง ~${(main.temp - (100 - main.humidity)/5).toFixed(1)}°C`, inline: true },
      { name: '☁️ เมฆ', value: `**${clouds.all}%**\nปกคลุม`, inline: true },
      { name: '💨 ลม', value: `**${wind.speed.toFixed(1)} m/s**\nทิศ ${windDir(wind.deg)} (${wind.deg}°)`, inline: true },
      { name: '👁️ ทัศนวิสัย', value: `**${(visibility / 1000).toFixed(1)} km**`, inline: true },
      { name: '🔽 ความกดอากาศ', value: `**${main.pressure} hPa**`, inline: true },
      { name: '🌅 พระอาทิตย์ขึ้น', value: `**${sunrise}**`, inline: true },
      { name: '🌇 พระอาทิตย์ตก', value: `**${sunset}**`, inline: true },
      { name: '🌡️ Min/Max วันนี้', value: `${main.temp_min.toFixed(1)}°C / ${main.temp_max.toFixed(1)}°C`, inline: true },
    )
    .setFooter({ text: `📍 ${coord.lat.toFixed(2)}, ${coord.lon.toFixed(2)} | อัปเดต ${updated}` })
    .setTimestamp();

  return { embed, coord, name };
}

function buildButtons(cityName) {
  const encoded = encodeURIComponent(cityName);
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`refresh_weather_${cityName}`)
      .setLabel('🔄 รีเฟรช')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`map_${cityName}`)
      .setLabel('🗺️ ดูแผนที่')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel('🌐 OpenWeatherMap')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://openweathermap.org/find?q=${encoded}`),
    new ButtonBuilder()
      .setCustomId(`forecast_btn_${cityName}`)
      .setLabel('📅 พยากรณ์ 5 วัน')
      .setStyle(ButtonStyle.Success),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('🌤️ ดูสภาพอากาศ Realtime พร้อมรูปแผนที่')
    .addStringOption(opt =>
      opt.setName('city')
         .setDescription('ชื่อเมือง เช่น Bangkok, Chiang Mai, Pattaya')
         .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const city = interaction.options.getString('city');
    try {
      const { embed } = await buildWeatherEmbed(city);
      const row = buildButtons(city);
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      await interaction.editReply({ content: `❌ ไม่พบเมือง **${city}** — ลองใช้ชื่อภาษาอังกฤษ` });
    }
  },

  async handleRefresh(interaction, city) {
    await interaction.deferUpdate();
    try {
      const { embed } = await buildWeatherEmbed(city);
      const row = buildButtons(city);
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      await interaction.followUp({ content: `❌ รีเฟรชไม่สำเร็จ`, flags: 64 });
    }
  },
};