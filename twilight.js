// Loaded in Discord's main process (by the installer's shim) and again as a renderer preload.
const { ipcMain, ipcRenderer, webFrame } = require('electron');

if (process.type === 'browser') {
  const fs = require('fs'), path = require('path'), https = require('https');
  const read = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8'); } catch { return ''; } };
  const json = f => { try { return JSON.parse(read(f)); } catch { return {}; } };
  // For files we also WRITE (config.json): undefined when it can't be read, so a bad read never turns into an empty file that wipes the token.
  const jsonStrict = f => { try { const o = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')); return o && typeof o === 'object' && !Array.isArray(o) ? o : undefined; } catch { return undefined; } };
  const writeAtomic = (f, text) => { const out = path.join(__dirname, f), tmp = out + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, out); };
  const name = n => path.basename(String(n));

  // Every plugin file in plugins/ loads unless its name is listed in config.json "disabled".
  const listPlugins = () => {
    try { return fs.readdirSync(path.join(__dirname, 'plugins')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)); }
    catch { return []; }
  };

  const build = () => {
    const cfg = json('config.json'), off = new Set(cfg.disabled || []);
    // Safe mode: only the core and the menu load (no plugins, no themes). Switch on with the menu, config.json "safeMode": true,
    // the --twilight-safe launch flag, or by creating a file called safe.flag next to the mod.
    const safe = !!cfg.safeMode || process.argv.includes('--twilight-safe') || fs.existsSync(path.join(__dirname, 'safe.flag'));
    const sizes = {};
    const plugins = safe ? '' : listPlugins().filter(n => !off.has(n)).map(n => {
      const src = read(`plugins/${name(n)}.js`); sizes[name(n)] = src.length;
      return `try{\n${src}\n}catch(e){console.error("[twilight] plugin ${name(n)}",e)}`;
    }).join('\n');
    const css = safe ? '' : (cfg.themes || []).map(n => read(`themes/${name(n)}.css`)).join('\n');
    const opts = { version: json('manifest.json').version || '?', debugKey: cfg.debugKey || 'ctrl+f', safe, sizes, hasKey: false };
    const seed = JSON.stringify(json('settings.json')).replace(/</g, '\\u003c');
    const body = `${read('core.js')}\n${read('debug.js')}\n${plugins}`;
    opts.kb = Math.round((body.length + css.length) / 1024);
    // sourceURL names the bundle in DevTools, stack traces and CPU profiles (otherwise it shows up as an anonymous script).
    return `window.__twSeed=${seed};\n${body}\nTwilight.start(${JSON.stringify(css)},${JSON.stringify(opts)});\n//# sourceURL=twilight-bundle.js`;
  };

  // ---- windows: the first big window is the main one; every window made after it (video / chat pop-outs and the like) is a pop-out.
  // Pop-outs can be hidden from screen capture (config.json "hidePopouts", default true; menu: Tools > Housekeeping).
  // (Window glass, the see-through window and the custom snapper were removed in 1.12.0: the main window is Discord's normal window.)
  const popouts = new Set(); let mainWin = null;
  const hideOn = () => json('config.json').hidePopouts !== false;
  try {
    const electron = require('electron'), key = require.resolve('electron'), Orig = electron.BrowserWindow;
    class TwilightWindow extends Orig {
      constructor(o = {}) {
        const big = !o.parent && (o.minWidth || o.width || 0) >= 700; // not the small splash / update windows
        const main = big && !mainWin;
        super(o);
        if (main) {
          mainWin = this; this.once('closed', () => { mainWin = null; });
        } else if (mainWin && !this.isDestroyed()) {
          popouts.add(this); this.once('closed', () => popouts.delete(this));
          try { if (hideOn()) this.setContentProtection(true); } catch {}
        }
      }
    }
    delete require.cache[key].exports;
    require.cache[key].exports = { ...electron, BrowserWindow: TwilightWindow };
  } catch (e) { console.error('[twilight] window wrapper failed', e); }
  // Real usage numbers for Discord Stable and Discord PTB, whichever runs the mod (Windows). One short PowerShell run, only when you ask (overlay > Measure).
  const PS_SCRIPT = [
    "$ErrorActionPreference='SilentlyContinue'",
    "function snap { Get-Process -Name Discord,DiscordPTB | ForEach-Object { [pscustomobject]@{n=$_.ProcessName;id=$_.Id;ws=[double]$_.WorkingSet64;cpu=[double]$_.CPU} } }",
    "$a=snap; $t0=Get-Date",
    "$eng=Get-Counter '\\GPU Engine(*)\\Utilization Percentage' -SampleInterval 1 -MaxSamples 2",
    "$mem=Get-Counter '\\GPU Process Memory(*)\\Dedicated Usage'",
    "$b=snap; $dt=((Get-Date)-$t0).TotalSeconds",
    "$cores=[Environment]::ProcessorCount; $gu=@{}; $gm=@{}",
    "if($eng){ foreach($s in $eng[-1].CounterSamples){ if($s.InstanceName -match 'pid_(\\d+)_'){ $gu[[int]$Matches[1]]+=$s.CookedValue } } }",
    "if($mem){ foreach($s in $mem.CounterSamples){ if($s.InstanceName -match 'pid_(\\d+)_'){ $gm[[int]$Matches[1]]+=$s.CookedValue } } }",
    "$out=@{cores=$cores; apps=@{}}",
    "foreach($n in 'Discord','DiscordPTB'){ $pb=@($b | Where-Object n -eq $n); if(-not $pb.Count){continue}",
    "  $pa=@($a | Where-Object n -eq $n); $ids=@($pb | ForEach-Object id)",
    "  $c0=0; $c1=0; $old=@($pa | ForEach-Object id); foreach($p in $pa){ $c0+=$p.cpu }; foreach($p in $pb){ if($old -contains $p.id){ $c1+=$p.cpu } }",
    "  $g=0; $m=0; foreach($i in $ids){ $g+=[double]$gu[[int]$i]; $m+=[double]$gm[[int]$i] }",
    "  $out.apps[$n]=@{procs=$pb.Count; ramMB=[math]::Round(($pb | Measure-Object ws -Sum).Sum/1MB); cpuPct=[math]::Round(($c1-$c0)/$dt/$cores*100,1); gpuPct=[math]::Round($g,1); gpuMB=[math]::Round($m/1MB)} }",
    "$out | ConvertTo-Json -Depth 4 -Compress",
  ].join('\n');
  const metrics = () => new Promise(resolve => {
    if (process.platform !== 'win32') return resolve({ error: 'Windows only' });
    require('child_process').execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(PS_SCRIPT, 'utf16le').toString('base64')],
      { windowsHide: true, timeout: 25000 }, (err, out) => {
        // "self" = the channel this window is running in (Discord.exe = Stable, DiscordPTB.exe = PTB), so the overlay can label the columns.
        try { resolve({ ...JSON.parse(out), self: /ptb/i.test(path.basename(process.execPath)) ? 'DiscordPTB' : 'Discord' }); } catch { resolve({ error: err ? String(err.message).slice(0, 80) : 'no data' }); }
      });
  });

  // Small HTTPS helper for the two features that need the internet from the main process (translation, the assistant).
  // Page code never sees the API key: it only sends text in and gets text back.
  const httpsJson = (url, { method = 'GET', headers = {}, body } = {}) => new Promise(resolve => {
    try {
      const u = new URL(url), req = https.request({ method, hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'twilight-cord', ...headers }, timeout: 45000 }, r => {
        const b = []; r.on('data', c => b.push(c));
        r.on('end', () => { const t = Buffer.concat(b).toString('utf8'); try { resolve({ status: r.statusCode, json: JSON.parse(t) }); } catch { resolve({ status: r.statusCode, error: t.slice(0, 120) }); } });
      });
      req.on('timeout', () => req.destroy(new Error('timeout'))); req.on('error', e => resolve({ error: String(e.message || e).slice(0, 100) }));
      if (body) req.write(body); req.end();
    } catch (e) { resolve({ error: String(e.message || e) }); }
  });
  const translate = async (text, to) => {
    const r = await httpsJson(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`);
    if (!r.json) return { error: r.error || 'HTTP ' + r.status };
    return { text: (r.json[0] || []).map(p => p[0]).join(''), from: r.json[2] };
  };

  // The Theme tab asks for window changes through here (only these few keys, nothing else is writable).
  ipcMain.handle('twilight:cmd', (e, c) => {
    if (c?.type === 'win' && ['minimize', 'maximize', 'close'].includes(c.op)) { // the Window buttons plugin (top right)
      try {
        const w = require('electron').BrowserWindow.fromWebContents(e.sender) || mainWin; if (!w || w.isDestroyed()) return { ok: false };
        if (c.op === 'minimize') w.minimize(); else if (c.op === 'close') w.close(); else if (w.isMaximized()) w.unmaximize(); else w.maximize();
        return { ok: true };
      } catch (err) { return { ok: false, error: String(err.message || err).slice(0, 100) }; }
    }
    if (c?.type === 'status') return { mode: 'off', hidePopouts: hideOn(), popouts: popouts.size };
    if (c?.type === 'popouts' && typeof c.on === 'boolean') {
      const cfg = jsonStrict('config.json'); if (!cfg) return { ok: false, error: 'config.json unreadable, left alone' };
      cfg.hidePopouts = c.on; writeAtomic('config.json', JSON.stringify(cfg, null, 2));
      for (const w of popouts) { try { if (!w.isDestroyed()) w.setContentProtection(c.on); } catch {} }
      return { on: c.on, popouts: popouts.size };
    }
    if (c?.type === 'metrics') return metrics();
    if (c?.type === 'translate' && typeof c.text === 'string' && c.text.length < 3000 && /^[\w-]{2,8}$/.test(c.to || '')) return translate(c.text, c.to);
    // Reports the Probe plugin writes next to the mod (so Claude can read them from the folder). Fixed names only.
    if (c?.type === 'report' && /^[\w-]{1,40}\.(json|txt|log)$/.test(c.name) && typeof c.text === 'string' && c.text.length < 2e6) {
      const dir = path.join(__dirname, 'reports'); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, c.name), c.text);
      return { ok: true };
    }
    if (c?.type === 'save' && c.data && typeof c.data === 'object' && !Array.isArray(c.data)) {
      const text = JSON.stringify(c.data);
      if (text.length > 2e6) return { ok: false };
      writeAtomic('settings.json', text);
      return { ok: true };
    }
    if (c?.type === 'safe') {
      const f = path.join(__dirname, 'safe.flag');
      if (c.on) fs.writeFileSync(f, 'safe mode on'); else fs.rmSync(f, { force: true });
      require('electron').app.relaunch(); require('electron').app.exit(0);
    }
    if (c?.type === 'relaunch') { require('electron').app.relaunch(); require('electron').app.exit(0); }
    return null;
  });

  // ---- auto updater: pulls manifest.json + listed files from the (private) GitHub repo ----
  const SAFE = /^(core\.js|debug\.js|twilight\.js|plugins\/[\w-]+\.js|themes\/[\w-]+\.css)$/;
  const num = x => parseInt(x, 10) || 0; // "13-beta" counts as 13
  const newer = (a, b) => {
    const x = String(a).split('.').map(num), y = String(b).split('.').map(num);
    for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    return false;
  };
  const get = (url, token) => new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'twilight-cord', Accept: 'application/vnd.github.raw+json', ...(token && { Authorization: `Bearer ${token}` }) },
    }, r => {
      if (r.statusCode !== 200) { r.resume(); return reject(new Error('HTTP ' + r.statusCode)); }
      const b = []; r.on('data', c => b.push(c)); r.on('end', () => resolve(Buffer.concat(b)));
    });
    req.setTimeout(10000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });

  // Several Discords (Stable, PTB, Canary) share this folder and all check for updates when they start. A lock file makes sure only one does the swap.
  const takeLock = () => {
    const f = path.join(__dirname, 'update.lock');
    try { if (Date.now() - fs.statSync(f).mtimeMs > 120000) fs.rmSync(f, { force: true }); } catch {}
    try { fs.closeSync(fs.openSync(f, 'wx')); return () => fs.rmSync(f, { force: true }); } catch { return null; }
  };
  const swap = (from, to) => { try { fs.renameSync(from, to); } catch { fs.copyFileSync(from, to); fs.rmSync(from, { force: true }); } }; // rename can fail on Windows if something has the file open

  const check = async () => {
    const { repo, branch = 'main', token } = json('config.json');
    if (!repo) return null;
    const url = f => `https://api.github.com/repos/${repo}/contents/${f}?ref=${encodeURIComponent(branch)}`;
    const remote = JSON.parse(await get(url('manifest.json'), token));
    if (!newer(remote.version, json('manifest.json').version || '0')) return null;
    const unlock = takeLock(); if (!unlock) return null; // another Discord is updating right now: it will do it
    try {
      const files = (remote.files || []).filter(f => SAFE.test(f)).slice(0, 80);
      if (!files.includes('core.js') || !files.includes('twilight.js')) throw new Error('manifest incomplete');
      const data = await Promise.all(files.map(async f => [f, await get(url(f), token)]));
      // Check everything BEFORE touching the installed files: not empty, not huge, and every .js file must at least parse.
      const vm = require('vm');
      for (const [f, buf] of data) {
        if (!buf.length || buf.length > 3e6) throw new Error('bad file ' + f);
        if (f.endsWith('.js')) { try { new vm.Script(buf.toString('utf8'), { filename: f }); } catch (e) { throw new Error('syntax error in ' + f); } }
      }
      // Write each file next to its place first, then swap them all in one go, so a crash half way never leaves a mix of old and new.
      const staged = [];
      try {
        for (const [f, buf] of data) { const out = path.join(__dirname, f); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out + '.new', buf); staged.push(out); }
      } catch (e) { for (const o of staged) fs.rmSync(o + '.new', { force: true }); throw e; }
      for (const o of staged) swap(o + '.new', o);
      // remove files we managed before that the new manifest dropped (never touches files we didn't ship)
      for (const f of json('manifest.json').files || [])
        if (!files.includes(f) && SAFE.test(f)) fs.rmSync(path.join(__dirname, f), { force: true });
      writeAtomic('manifest.json', JSON.stringify(remote, null, 2));
      return { updated: remote.version, restart: files.includes('twilight.js') };
    } finally { unlock(); }
  };

  // ---- keeps itself installed ----
  // Discord puts a brand-new app-* folder in place on every update, and that drops the hook. While Discord runs, watch the Discord
  // folders (event-driven, no polling) and put the hook back into any new build, so the next start is already patched.
  const HOOK_MARK = 'Twilight hook';
  const hookText = () => [
    '// Twilight hook (in a module, so Discord\'s own updates can still patch app.asar)',
    `const __fs = require('fs'), __LOG = ${JSON.stringify(path.join(__dirname, 'reports', 'launch.txt'))};`,
    "const __note = s => { try { __fs.appendFileSync(__LOG, new Date().toISOString() + ' ' + s + '\\n'); } catch (e) {} };",
    "__note('core hook ran');",
    `try { require(${JSON.stringify(path.join(__dirname, 'twilight.js'))}); __note('twilight.js loaded'); } catch (e) { __note('twilight.js FAILED: ' + (e && e.stack || e)); }`,
    "module.exports = require('./core.asar');", ''].join('\n');
  const verCmp = (a, b) => { const x = a.replace('app-', '').split('.').map(num), y = b.replace('app-', '').split('.').map(num); for (let i = 0; i < 4; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
  const ensureHook = base => {
    try {
      const app = fs.readdirSync(base).filter(x => /^app-\d/.test(x)).sort(verCmp).pop(); if (!app) return;
      const mods = path.join(base, app, 'modules'), core = fs.readdirSync(mods).filter(x => x.startsWith('discord_desktop_core')).sort().pop(); if (!core) return;
      const dir = path.join(mods, core, 'discord_desktop_core'), f = path.join(dir, 'index.js');
      if (!fs.existsSync(path.join(dir, 'core.asar'))) return; // the module is not fully in place yet: the next attempt will do it
      const cur = fs.readFileSync(f, 'utf8');
      if (cur.includes(HOOK_MARK)) return;
      if (!/^\s*module\.exports\s*=\s*require\(\s*['"]\.\/core\.asar['"]\s*\)\s*;?\s*$/.test(cur)) { // not Discord's usual one-liner: leave it, say so once
        fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });
        if (!fs.existsSync(path.join(__dirname, 'reports', 'hook-skipped.txt'))) fs.writeFileSync(path.join(__dirname, 'reports', 'hook-skipped.txt'), `${new Date().toISOString()} ${app}: index.js is not the usual one-liner, left alone. Run the launcher to repair.\n`);
        return;
      }
      fs.writeFileSync(f, hookText());
      fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });
      fs.appendFileSync(path.join(__dirname, 'reports', 'launch.txt'), `${new Date().toISOString()} hook put back into ${path.basename(base)}/${app}\n`);
    } catch {}
  };
  const keepHook = () => {
    const local = process.env.LOCALAPPDATA; if (!local) return;
    for (const d of ['Discord', 'DiscordPTB', 'DiscordCanary']) {
      const base = path.join(local, d); if (!fs.existsSync(base)) continue;
      ensureHook(base);
      let t = 0;
      try { fs.watch(base, { persistent: false }, (ev, name) => { if (!/^app-/.test(String(name || 'app-'))) return; clearTimeout(t); t = setTimeout(() => { ensureHook(base); setTimeout(() => ensureHook(base), 30000); setTimeout(() => ensureHook(base), 120000); }, 5000); }); } catch {}
    }
  };

  let pending, delivered = false;
  const { app, session } = require('electron');
  ipcMain.on('twilight:code', e => { e.returnValue = build(); });
  ipcMain.handle('twilight:update', async () => {
    const r = await pending;
    if (delivered) return null;
    delivered = true;
    return r;
  });
  app.whenReady().then(() => {
    try { keepHook(); } catch {}
    pending = check().catch(e => ({ error: e.message }));
    const s = session.defaultSession;
    s.setPreloads([...s.getPreloads(), __filename]);
  });
} else if (location.hostname.endsWith('discord.com') && !window.opener) { // not in pop-out windows
  // Lets the page (Twilight's Theme tab) talk to the main process: a request event in, a reply event out.
  window.addEventListener('twilight-cmd', e => {
    let d; try { d = JSON.parse(e.detail); } catch { return; }
    ipcRenderer.invoke('twilight:cmd', d.cmd).then(r => window.dispatchEvent(new CustomEvent('twilight-reply', { detail: JSON.stringify({ id: d.id, r }) })), () => {});
  });
  webFrame.executeJavaScript(ipcRenderer.sendSync('twilight:code'));
  ipcRenderer.invoke('twilight:update').then(r => {
    if (!r) return;
    const msg = r.error ? ['Update check failed', r.error.slice(0, 60), 'error']
      : ['Updated', `v${r.updated} · ${r.restart ? 'restart Discord' : 'press Ctrl+R'} to apply`, 'success'];
    webFrame.executeJavaScript(`Twilight.notify(${JSON.stringify(msg[0])},${JSON.stringify(msg[1])},6000,${JSON.stringify(msg[2])})`);
  }).catch(() => {});
}
