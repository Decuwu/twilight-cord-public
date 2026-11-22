// Twilight-Cord launcher: one program that puts the current build into every Discord you have (Stable, PTB, Canary).
// Double-click to run. After that the mod keeps itself up to date from GitHub (auto-updater) and puts its own hook back after Discord updates.
// Command line: launcher [install|repair|uninstall] [stable|ptb|canary|all]   (default: install into every Discord found, no questions)
const fs = require('fs'), path = require('path'), https = require('https'), readline = require('readline');
const ver = s => s.replace('app-', '').split('.').map(Number);
const cmp = (a, b) => { const x = ver(a), y = ver(b); for (let i = 0; i < 4; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

// One mod folder shared by every channel, so settings, plugins and the auto-updater are the same everywhere.
const CHANNELS = { stable: { dir: 'Discord', label: 'Discord (Stable)' }, ptb: { dir: 'DiscordPTB', label: 'Discord PTB' }, canary: { dir: 'DiscordCanary', label: 'Discord Canary' } };
const baseOf = c => path.join(process.env.LOCALAPPDATA || '', CHANNELS[c].dir);
const found = () => Object.keys(CHANNELS).filter(c => fs.existsSync(baseOf(c)));
const dest = path.join(process.env.APPDATA || '', 'twilight-cord');
const bundled = f => fs.readFileSync(path.join(__dirname, f));
const manifest = JSON.parse(bundled('manifest.json'));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

// Private build only (its manifest lists the owner-only developer bridge): PTB gets its own copy of the PUBLIC build in a "ptb" folder inside the mod folder, so Stable can run
// dev builds while PTB stays on the latest public release (it updates itself from the public repo). The public launcher keeps one shared folder for everything.
const SPLIT = manifest.files.includes('plugins/devBridge.js'), ptbDest = path.join(dest, 'ptb'), PUBLIC_REPO = 'Decuwu/twilight-cord-public';
const PTB_MARK = "path.basename(__dirname).toLowerCase() === 'ptb'"; // only public builds that know about the split can be used for PTB (older ones would rewrite Stable's hook)
let ptbReady = false;
const httpGet = url => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': 'twilight-cord', Accept: 'application/vnd.github.raw+json' } }, r => {
    if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
    const b = []; r.on('data', x => b.push(x)); r.on('end', () => res(Buffer.concat(b)));
  }).on('error', rej);
});
const setupPtb = async () => {
  if (!SPLIT) return;
  try {
    if (!fs.existsSync(path.join(ptbDest, 'twilight.js'))) {
      const raw = f => httpGet(`https://api.github.com/repos/${PUBLIC_REPO}/contents/${f}?ref=main`);
      const man = JSON.parse(await raw('manifest.json'));
      const names = [...new Set([...man.files, 'manifest.json', 'config.json'])].filter(f => /^[\w./-]+$/.test(f) && !f.includes('..'));
      const data = await Promise.all(names.map(async f => [f, await raw(f)])); // everything first, then write: a failed download leaves nothing half done
      for (const [f, buf] of data) { const out = path.join(ptbDest, f); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, buf); }
    }
    if (!fs.readFileSync(path.join(ptbDest, 'twilight.js'), 'utf8').includes(PTB_MARK)) { console.log('Discord PTB: the public build is too old to run separately (needs the next public release). PTB stays on the shared build for now.'); return; }
    const seed = path.join(ptbDest, 'settings.json'); // first time only: start from the same settings as the main folder
    if (!fs.existsSync(seed) && fs.existsSync(path.join(dest, 'settings.json'))) fs.copyFileSync(path.join(dest, 'settings.json'), seed);
    ptbReady = true; console.log('Discord PTB: public build in ' + ptbDest + ' (updates itself from the public repo)');
  } catch (e) { console.log('Discord PTB: could not set up the public copy (' + e.message + '). PTB stays on the shared build.'); }
};

// The hook: a few lines inside Discord's own discord_desktop_core module (app.asar stays untouched, so Discord's updater keeps working).
// twilight.js puts this same text back by itself after every Discord update.
const hookText = (D = dest) => [
  "// Twilight hook (in a module, so Discord's own updates can still patch app.asar)",
  `const __fs = require('fs'), __LOG = ${JSON.stringify(path.join(D, 'reports', 'launch.txt'))};`,
  "const __note = s => { try { __fs.appendFileSync(__LOG, new Date().toISOString() + ' ' + s + '\\n'); } catch (e) {} };",
  "__note('core hook ran');",
  `try { require(${JSON.stringify(path.join(D, 'twilight.js'))}); __note('twilight.js loaded'); } catch (e) { __note('twilight.js FAILED: ' + (e && e.stack || e)); }`,
  "module.exports = require('./core.asar');", ''].join('\n');

const newest = c => {
  const base = baseOf(c);
  if (!fs.existsSync(base)) throw new Error(CHANNELS[c].label + ' not found at ' + base);
  const dirs = fs.readdirSync(base).filter(x => /^app-\d/.test(x)).sort(cmp);
  if (!dirs.length) throw new Error('No app-* folder in ' + base);
  return path.join(base, dirs.pop());
};
const coreDir = appDir => {
  const mods = path.join(appDir, 'modules');
  const core = fs.existsSync(mods) ? fs.readdirSync(mods).filter(x => x.startsWith('discord_desktop_core')).sort().pop() : null;
  if (!core) throw new Error('discord_desktop_core module not found in ' + mods + ' (start Discord once, let it finish updating, close it, try again)');
  return path.join(mods, core, 'discord_desktop_core');
};
// Older builds of this installer renamed app.asar: put that back so the hook is the only thing in place.
const undoLegacy = appDir => {
  const r = path.join(appDir, 'resources'), bak = path.join(r, '_app.asar');
  if (fs.existsSync(bak)) { fs.rmSync(path.join(r, 'app'), { recursive: true, force: true }); if (!fs.existsSync(path.join(r, 'app.asar'))) fs.renameSync(bak, path.join(r, 'app.asar')); }
};

const patch = c => {
  const app = newest(c), dir = coreDir(app), f = path.join(dir, 'index.js');
  if (!fs.existsSync(path.join(dir, 'core.asar'))) throw new Error('core.asar missing in ' + dir);
  undoLegacy(app);
  try { const cur = fs.readFileSync(f, 'utf8'); if (!cur.includes('Twilight hook') && !/^\s*module\.exports\s*=\s*require\(\s*['"]\.\/core\.asar['"]\s*\)\s*;?\s*$/.test(cur)) fs.copyFileSync(f, f + '.twilight-backup'); } catch {}
  fs.writeFileSync(f, hookText(c === 'ptb' && ptbReady ? ptbDest : dest));
  console.log(CHANNELS[c].label + ': ' + path.basename(app) + ' ready' + (c === 'ptb' && ptbReady ? ' (public build)' : ''));
};
const uninstall = c => {
  const app = newest(c), f = path.join(coreDir(app), 'index.js');
  fs.writeFileSync(f, "module.exports = require('./core.asar');\n"); undoLegacy(app);
  console.log(CHANNELS[c].label + ': removed from ' + path.basename(app) + ' (your settings are still in ' + dest + ')');
};

// Mod files + config.json: done once for all channels. Code files are always refreshed; config.json is kept if it exists.
const setup = async () => {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of [...manifest.files, 'manifest.json']) {
    const out = path.join(dest, f);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, bundled(f));
  }
  const cfgPath = path.join(dest, 'config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : JSON.parse(bundled('config.json'));
  if (!cfg.token && process.stdin.isTTY) {
    const token = (await ask('GitHub token for auto-updates (read-only; Enter to skip): ')).trim();
    if (token) cfg.token = token;
  }
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log('Mod folder: ' + dest + (cfg.token ? '' : '  (no token yet: auto-update stays off until you add one to config.json)'));
};

(async () => {
  let cmd = (process.argv[2] || 'install').toLowerCase(), pick = (process.argv[3] || 'all').toLowerCase();
  if (cmd === 'repair') cmd = 'install';
  if (CHANNELS[cmd]) { pick = cmd; cmd = 'install'; }
  if (cmd !== 'install' && cmd !== 'uninstall') { console.log('Usage: launcher [install|repair|uninstall] [stable|ptb|canary|all]'); process.exit(1); }
  const have = found(), targets = CHANNELS[pick] ? [pick] : have;
  try {
    if (!targets.length) throw new Error('No Discord found in ' + (process.env.LOCALAPPDATA || '%LOCALAPPDATA%'));
    console.log('Found: ' + have.map(c => CHANNELS[c].label).join(', '));
    if (cmd === 'install') { await setup(); if (targets.includes('ptb')) await setupPtb(); }
    let ok = 0;
    for (const c of targets) { try { cmd === 'uninstall' ? uninstall(c) : patch(c); ok++; } catch (e) { console.error(CHANNELS[c].label + ': ' + e.message); } }
    if (ok) console.log('\nFully quit ' + targets.map(c => CHANNELS[c].label).join(' and ') + ' (check the tray), then start ' + (targets.length > 1 ? 'them' : 'it') + ' again.');
  } catch (e) { console.error('Error: ' + e.message + '\n(Make sure Discord is fully closed.)'); }
  if (process.stdin.isTTY) await ask('\nPress Enter to close...');
  process.exit();
})();
