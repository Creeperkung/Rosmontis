const Database = require('better-sqlite3');
const db = new Database('bot.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS voice_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    left_at INTEGER,
    duration_seconds INTEGER
  )
`);

module.exports = {
  // --- Voice tracking ---
  startSession: (guildId, userId, channelId) => {
    db.prepare(`
      INSERT INTO voice_sessions (guild_id, user_id, channel_id, joined_at)
      VALUES (?, ?, ?, ?)
    `).run(guildId, userId, channelId, Math.floor(Date.now() / 1000));
  },

  endSession: (guildId, userId, channelId) => {
    const now = Math.floor(Date.now() / 1000);

    const session = db.prepare(`
      SELECT * FROM voice_sessions
      WHERE user_id = ? AND guild_id = ? AND channel_id = ? AND left_at IS NULL
      ORDER BY joined_at DESC LIMIT 1
    `).get(userId, guildId, channelId);

    if (!session) return;

    const duration = now - session.joined_at;

    db.prepare(`
      UPDATE voice_sessions SET left_at = ?, duration_seconds = ?
      WHERE id = ?
    `).run(now, duration, session.id);
  },

  closeOrphanedSessions: () => {
    db.prepare(`
      UPDATE voice_sessions SET left_at = ?, duration_seconds = 0
      WHERE left_at IS NULL
    `).run(Math.floor(Date.now() / 1000));
  },

    getTotalTime: (guildId, userId) => {
    const completed = db.prepare(`
        SELECT SUM(duration_seconds) as total
        FROM voice_sessions
        WHERE guild_id = ? AND user_id = ? AND left_at IS NOT NULL
    `).get(guildId, userId);

    const active = db.prepare(`
        SELECT joined_at FROM voice_sessions
        WHERE guild_id = ? AND user_id = ? AND left_at IS NULL
    `).get(guildId, userId);

    const activeSeconds = active
        ? Math.floor(Date.now() / 1000) - active.joined_at
        : 0;

    return (completed.total || 0) + activeSeconds;
    },

    getLeaderboard: (guildId, limit = 10) => {
    const rows = db.prepare(`
        SELECT user_id, SUM(duration_seconds) as total
        FROM voice_sessions
        WHERE guild_id = ? AND left_at IS NOT NULL
        GROUP BY user_id
    `).all(guildId);

    const activeSessions = db.prepare(`
        SELECT user_id, joined_at FROM voice_sessions
        WHERE guild_id = ? AND left_at IS NULL
    `).all(guildId);

    const now = Math.floor(Date.now() / 1000);
    const totals = {};

    for (const row of rows) {
        totals[row.user_id] = row.total || 0;
    }

    for (const session of activeSessions) {
        const elapsed = now - session.joined_at;
        totals[session.user_id] = (totals[session.user_id] || 0) + elapsed;
    }

    return Object.entries(totals)
        .map(([user_id, total]) => ({ user_id, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    },

    getHistory: (guildId, userId, limit = 10) => {
    const rows = db.prepare(`
        SELECT channel_id, joined_at, left_at, duration_seconds
        FROM voice_sessions
        WHERE guild_id = ? AND user_id = ? AND left_at IS NOT NULL
        ORDER BY joined_at DESC
        LIMIT ?
    `).all(guildId, userId, limit);

    const active = db.prepare(`
        SELECT channel_id, joined_at
        FROM voice_sessions
        WHERE guild_id = ? AND user_id = ? AND left_at IS NULL
    `).get(guildId, userId);

    if (active) {
        const now = Math.floor(Date.now() / 1000);
        const liveSession = {
        channel_id: active.channel_id,
        joined_at: active.joined_at,
        left_at: null,
        duration_seconds: now - active.joined_at
        };
        // Put the active session at the top, trim to limit
        return [liveSession, ...rows].slice(0, limit);
    }

    return rows;
    }
};