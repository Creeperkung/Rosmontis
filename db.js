const Database = require('better-sqlite3');
const db = new Database('repos.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS watched_repos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    owner TEXT NOT NULL,
    repo TEXT NOT NULL,
    secret TEXT NOT NULL,
    hook_id INTEGER NOT NULL,
    UNIQUE(owner, repo)
  )
`);

module.exports = {
  addRepo: (guildId, channelId, owner, repo, secret, hookId) => {
    db.prepare(`INSERT INTO watched_repos (guild_id, channel_id, owner, repo, secret, hook_id)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(guildId, channelId, owner, repo, secret, hookId);
  },
  removeRepo: (owner, repo) => {
    db.prepare(`DELETE FROM watched_repos WHERE owner = ? AND repo = ?`).run(owner, repo);
  },
  getRepo: (owner, repo) => {
    return db.prepare(`SELECT * FROM watched_repos WHERE owner = ? AND repo = ?`).get(owner, repo);
  },
  listRepos: (guildId) => {
    return db.prepare(`SELECT * FROM watched_repos WHERE guild_id = ?`).all(guildId);
  }
};