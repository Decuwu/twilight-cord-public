// Keeps the Discord info channels up to date through webhooks (run by .github/workflows/discord.yml).
// coming-soon and current-features are one message each, edited in place; patch notes are one new message per release.
const fs = require('fs');
const env = process.env, REPO = env.GITHUB_REPOSITORY, EVENT = env.GITHUB_EVENT_NAME, BRANCH = 'discord-state';
const RELEASES = `https://github.com/${REPO}/releases`;
// Safety net: a line about anything private is never posted.
const PRIVATE = /plaude|claude|jarvis|twilight bot|assistant|dev ?bridge|server forge|motor ?town|fembot|private build/i;
const clean = t => t.replace(/<!-- private -->[\s\S]*?<!-- \/private -->/g, '').split(/\r?\n/).filter(l => !PRIVATE.test(l)).join('\n').trim();
const fit = (t, tail = '') => { if (t.length <= 4096) return t; const more = '\n…' + tail; const cut = t.slice(0, 4096 - more.length); return cut.slice(0, cut.lastIndexOf('\n')) + more; };
const embed = (title, text, url) => ({ username: 'Twilight', allowed_mentions: { parse: [] }, embeds: [{ title, description: text, color: 0xa894ff, ...(url ? { url } : {}) }] });
const doc = file => { const t = clean(fs.readFileSync(file, 'utf8')), m = /^# (.+)\n/.exec(t); return embed(m ? m[1] : file, fit(m ? t.slice(m[0].length).trim() : t)); };

async function gh(path, opt = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${path}`, { ...opt, headers: { authorization: `Bearer ${env.GH_TOKEN}`, accept: 'application/vnd.github+json' } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub ${path}: ${r.status}`);
  return r.json();
}
// Which messages were posted before lives in state.json on its own branch, so main is never touched.
async function load() { const f = await gh(`contents/state.json?ref=${BRANCH}`); return { sha: f?.sha, data: f ? JSON.parse(Buffer.from(f.content, 'base64')) : {} }; }
async function save(s) {
  if (!await gh(`git/ref/heads/${BRANCH}`)) await gh('git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: env.GITHUB_SHA }) });
  const f = await gh(`contents/state.json?ref=${BRANCH}`);
  await gh('contents/state.json', { method: 'PUT', body: JSON.stringify({ message: 'discord message ids', branch: BRANCH, sha: f?.sha, content: Buffer.from(JSON.stringify(s.data, null, 2)).toString('base64') }) });
}
// Never print the webhook address: it works like a password.
async function hook(url, body, id) {
  const u = new URL(url.trim()); if (id) u.pathname += `/messages/${id}`; else u.searchParams.set('wait', 'true');
  const { username, ...edit } = body;
  const r = await fetch(u, { method: id ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(id ? edit : body) });
  if (id && r.status === 404) return hook(url, body); // the old message was deleted: post a fresh one
  if (!r.ok) throw new Error(`Discord answered ${r.status}`);
  return (await r.json()).id;
}

(async () => {
  const s = await load(); let failed = false;
  const step = async (label, secret, run) => {
    if (!env[secret]) return console.log(`::notice::${label}: skipped, the secret ${secret} is not set`);
    try { await run(env[secret]); await save(s); console.log(`${label}: done`); } catch (e) { failed = true; console.log(`::error::${label}: ${e.message}`); }
  };
  for (const [key, file, secret] of [['comingSoon', 'COMING_SOON.md', 'DISCORD_COMING_SOON'], ['features', 'FEATURES.md', 'DISCORD_FEATURES']])
    await step(key, secret, async url => { s.data[key] = await hook(url, doc(file), s.data[key]); });
  if (EVENT !== 'push') await step('patchNotes', 'DISCORD_PATCH_NOTES', async url => {
    const v = JSON.parse(fs.readFileSync('manifest.json', 'utf8')).version;
    if (s.data.patchVersion === v) return console.log(`patch notes for ${v} were already posted`);
    if (!await gh(`releases/tags/v${v}`)) return console.log(`no release for ${v} yet`);
    const log = fs.readFileSync('CHANGELOG.md', 'utf8').replace(/\r/g, '');
    const section = log.split(/^(?=## )/m).find(b => b.startsWith(`## ${v}\n`)); if (!section) throw new Error(`CHANGELOG.md has no section for ${v}`);
    const link = `${RELEASES}/tag/v${v}`, tail = `\n\n**[Download ${v}](${link})**`;
    let text = clean(section.slice(section.indexOf('\n') + 1));
    if (!text.split('\n').some(l => l && !/^\*\*[^*]+\*\*$/.test(l.trim()))) text = 'Small fixes.'; // only headings left
    await hook(url, embed(`Twilight-Cord ${v}`, fit(text + tail, tail), link));
    s.data.patchVersion = v;
  });
  if (failed) process.exit(1);
})().catch(e => { console.log(`::error::${e.message}`); process.exit(1); });
