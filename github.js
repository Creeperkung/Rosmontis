const { Octokit } = require('octokit');
const crypto = require('crypto');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function createWebhook(owner, repo) {
  const secret = crypto.randomBytes(20).toString('hex');

  const res = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: process.env.WEBHOOK_URL,
      content_type: 'json',
      secret
    },
    events: ['push', 'pull_request', 'issues', 'release']
  });

  return { hookId: res.data.id, secret };
}

async function deleteWebhook(owner, repo, hookId) {
  await octokit.rest.repos.deleteWebhook({ owner, repo, hook_id: hookId });
}

module.exports = { createWebhook, deleteWebhook };