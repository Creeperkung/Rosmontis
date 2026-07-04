const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
//const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

async function geocode(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}&lang=th`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.length) throw new Error('Not found');
  return data[0]; // { lat, lon, name, country, state }
}

function buildMapEmbed(geo, zoom = 12) {
  const { lat, lon, name, country, state } = geo;
  const label = state ? `${name}, ${state}, ${country}` : `${name}, ${country}`;

  // Static map image via OpenStreetMap tiles (no key needed)
  // Using Yandex static maps as free fallback
  const staticMap = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=${zoom}&l=map&size=650,300&pt=${lon},${lat},pm2rdm&language=en_US`;

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lon}&z=${zoom}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
  const osmUrl       = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=${zoom}`;

  const embed = new EmbedBuilder()
    .setTitle(`🗺️ แผนที่ — ${label}`)
    .setColor(0x4285f4)
    .setDescription(`📍 **พิกัด:** \`${lat.toFixed(5)}, ${lon.toFixed(5)}\`\n🔍 **Zoom level:** ${zoom}`)
    .setImage(staticMap)
    .addFields(
      { name: '🌐 Latitude',  value: `\`${lat.toFixed(6)}\``,  inline: true },
      { name: '🌐 Longitude', value: `\`${lon.toFixed(6)}\``, inline: true },
      { name: '🏳️ ประเทศ',   value: country,                  inline: true },
    )
    .setFooter({ text: `แผนที่โดย Yandex Static Maps | คลิกปุ่มด้านล่างเพื่อเปิด Google Maps` })
    .setTimestamp();

  return { embed, googleMapsUrl, streetViewUrl, osmUrl, lat, lon, name };
}

function buildMapButtons(city, googleMapsUrl, streetViewUrl, osmUrl, zoom) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('📍 Google Maps').setStyle(ButtonStyle.Link).setURL(googleMapsUrl),
    new ButtonBuilder().setLabel('🚶 Street View').setStyle(ButtonStyle.Link).setURL(streetViewUrl),
    new ButtonBuilder().setLabel('🗺️ OpenStreetMap').setStyle(ButtonStyle.Link).setURL(osmUrl),
    new ButtonBuilder()
      .setCustomId(`map_zoomin_${zoom}_${city}`)   // encode zoom here
      .setLabel('🔍 Zoom IN')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(zoom >= 16),
    new ButtonBuilder()
      .setCustomId(`map_zoomout_${zoom}_${city}`)   
      .setLabel('🔍 Zoom OUT')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(zoom <= 8),                    // optional: disable at min zoom
  );
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('🗺️ ดูแผนที่พร้อมลิงก์ Google Maps')
    .addStringOption(opt =>
      opt.setName('city')
         .setDescription('ชื่อเมือง เช่น Bangkok, Phuket, Chiang Rai')
         .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('zoom')
         .setDescription('ระดับ Zoom (8-16, default: 12)')
         .setMinValue(8)
         .setMaxValue(16)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const city = interaction.options.getString('city');
    const zoom = interaction.options.getInteger('zoom') ?? 12;

    try {
      const geo = await geocode(city);
      const { embed, googleMapsUrl, streetViewUrl, osmUrl } = buildMapEmbed(geo, zoom);
      const row = buildMapButtons(city, googleMapsUrl, streetViewUrl, osmUrl, zoom);
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch {
      await interaction.editReply({ content: `❌ ไม่พบ **${city}** — ลองชื่อภาษาอังกฤษ` });
    }
  },

  async handleButton(interaction, customId) {
  await interaction.deferUpdate();
  // customId format: map_zoom_<zoom>_<city>
  const [, direction, zoomStr, ...cityParts] = customId.split('_');
  const currentZoom = parseInt(zoomStr, 10);
  const city = cityParts.join('_');

  try {
    const geo = await geocode(city);
    const newZoom = direction === 'zoomin'
      ? Math.min(16, currentZoom + 2)
      : Math.max(8, currentZoom - 2);
    const { embed, googleMapsUrl, streetViewUrl, osmUrl } = buildMapEmbed(geo, newZoom);
    const row = buildMapButtons(city, googleMapsUrl, streetViewUrl, osmUrl, newZoom);
    await interaction.editReply({ embeds: [embed], components: [row] });
    } catch {
    await interaction.followUp({ content: `❌ โหลดแผนที่ไม่สำเร็จ`, flags: 64 });
    }
  }
};