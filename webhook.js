const express = require('express');
const crypto = require('crypto');
const db = require('./db');

function verifySignature(secret, payload, signature) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function formatEmbed(event, body) {
  const repoName = body.repository.full_name;

  if (event === 'push') {
    const commits = body.commits.map(c => `\`${c.id.slice(0,7)}\` ${c.message.split('\n')[0]}`).join('\n');
    return { title: `📦 Push to ${repoName}`, description: commits, url: body.compare, color: 0x2b2d31 };
  }
  if (event === 'pull_request') {
    return { title: `🔀 PR ${body.action}: ${body.pull_request.title}`, url: body.pull_request.html_url, color: 0x8250df };
  }
  if (event === 'issues') {
    return { title: `❗ Issue ${body.action}: ${body.issue.title}`, url: body.issue.html_url, color: 0xd73a49 };
  }
  if (event === 'release') {
    return { title: `🚀 New release: ${body.release.name || body.release.tag_name}`, url: body.release.html_url, color: 0x2ea043 };
  }
  return { title: `Event: ${event} on ${repoName}`, color: 0x888888 };
}

function setupWebhook(client) {
  const app = express();
  app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

  app.post('/webhook/github', async (req, res) => {
    const event = req.headers['x-github-event'];
    const signature = req.headers['x-hub-signature-256'];
    const body = req.body;
    const [owner, repo] = body.repository.full_name.split('/');

    const entry = db.getRepo(owner, repo);
    if (!entry) return res.status(404).send('not watching');

    if (!verifySignature(entry.secret, req.rawBody, signature)) {
      return res.status(401).send('bad signature');
    }

    const channel = await client.channels.fetch(entry.channel_id);
    const embed = formatEmbed(event, body);
    await channel.send({ embeds: [embed] });

    res.status(200).send('ok');
  });

  app.listen(process.env.PORT || 3000, () => console.log('Webhook server listening'));
}

module.exports = setupWebhook;