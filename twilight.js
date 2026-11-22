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
  // One line per event in reports/launch.txt (starts, restarts, page ready), so a restart can be checked from the folder.
  const note = s => { try { fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true }); fs.appendFileSync(path.join(__dirname, 'reports', 'launch.txt'), `${new Date().toISOString()} ${s}\n`); } catch {} };
  // Which Discord this is. Stable, PTB and Canary share this folder, so anything aimed at one of them checks this.
  const CHANNEL = (b => b.includes('ptb') ? 'ptb' : b.includes('canary') ? 'canary' : 'stable')(path.basename(process.execPath).toLowerCase());
  // Restart through Discord's own Update.exe, the way the Start menu shortcut opens it: that starts the NEWEST app-* build.
  // A plain relaunch restarts this exact exe, which after a Discord update is the old build. Electron waits for this process
  // to exit before starting the new one, so Discord's one-window lock never sees two copies.
  const restart = why => {
    const { app } = require('electron'), upd = path.join(path.dirname(process.execPath), '..', 'Update.exe');
    note(`restart ${CHANNEL} (${why})`);
    try {
      if (process.platform === 'win32' && fs.existsSync(upd)) app.relaunch({ execPath: upd, args: ['--processStart', path.basename(process.execPath)] });
      else app.relaunch();
    } catch { app.relaunch(); }
    app.exit(0);
  };

  // ---- Slim Discord (1.17.0): config.json "slim": { games, krisp, disk }. Each part is off unless switched on (Tools > Housekeeping),
  // and takes effect at the next start. games: the in-game overlay, cloud game saves and the old game store never load.
  // krisp: Krisp noise suppression never loads (Discord's standard noise suppression still works). Their files stay where
  // Discord put them, so its updater has nothing to put back: they are only hidden from Discord when it goes to load them
  // (a module it can't find counts as not installed). discord_hook stays, because Go Live game capture uses it.
  // disk: a minute after start-up, older app-* builds, older installer packages and unused language packs are deleted.
  // Start-up log (1.18.1): short lines about what is loading, shown under the status text of the start-up screen.
  const bootSteps = [], bootSinks = new Set();
  const boot = step => {
    step = String(step).slice(0, 64); bootSteps.push(step); if (bootSteps.length > 30) bootSteps.shift();
    for (const wc of bootSinks) { if (wc.isDestroyed()) { bootSinks.delete(wc); continue; } wc.executeJavaScript(`window.__twBoot && __twBoot(${JSON.stringify(step)})`).catch(() => bootSinks.delete(wc)); }
  };
  boot(`twilight v${json('manifest.json').version || '?'} loaded`);
  let compareWaiting = false; // true while the Twilight half of a stock comparison is still being measured
  const slimCfg = () => { const v = json('config.json').slim; return v && typeof v === 'object' ? v : {}; };
  const SLIM = slimCfg();
  const BLOCK = new Set([...(SLIM.games ? ['discord_overlay2', 'discord_desktop_overlay', 'discord_cloudsync', 'discord_dispatch'] : []), ...(SLIM.krisp ? ['discord_krisp'] : [])]);
  const blockedPath = p => {
    const v = String(p).replace(/\\/g, '/').toLowerCase();
    for (const b of BLOCK) if (v === b || v.includes('/' + b + '-') || v.includes('/' + b + '/') || v.endsWith('/' + b) || v.endsWith('/' + b + '.node')) return b;
    return null;
  };
  const slimSeen = new Set(), slimNote = (b, how) => { if (!slimSeen.has(b + how)) { slimSeen.add(b + how); note(`slim ${CHANNEL}: kept ${b} from loading (${how})`); } };
  if (BLOCK.size) try {
    // Main process: Discord loads the desktop overlay here itself (inside a try, so a missing module just means no overlay).
    const Module = require('module'), load = Module._load;
    Module._load = function (req, ...r) {
      const b = typeof req === 'string' && req.includes('discord_') ? blockedPath(req) : null;
      if (b) { slimNote(b, 'main'); const e = new Error(`Cannot find module '${req}' (switched off by Twilight)`); e.code = 'MODULE_NOT_FOUND'; throw e; }
      return load.call(this, req, ...r);
    };
    // Windows: the page and pop-outs ask the main process where modules live (sync and async) and to install them. Discord
    // registers these handlers after this file runs, so they are wrapped as they are registered.
    const PATHS = 'DISCORD_NATIVE_MODULES_GET_PATHS', ONE = 'DISCORD_NATIVE_MODULES_GET_MODULE_PATH', INSTALL = 'DISCORD_NATIVE_MODULES_INSTALL';
    const fix = (ch, v, name) => {
      if (ch === ONE) { if (BLOCK.has(name)) { slimNote(name, 'path'); return null; } return v; }
      if (ch === PATHS && v && Array.isArray(v.browserModulePaths)) return { ...v, browserModulePaths: v.browserModulePaths.filter(x => !blockedPath(x)) };
      return v;
    };
    const on = ipcMain.on.bind(ipcMain), handle = ipcMain.handle.bind(ipcMain);
    ipcMain.on = function (ch, fn) {
      if (ch !== PATHS && ch !== ONE) return on(ch, fn);
      // event.returnValue sends the reply the moment it is set, so the handler gets a stand-in event that fixes the value first.
      return on(ch, (e, ...a) => fn(new Proxy(e, {
        set(t, k, v) { t[k] = k === 'returnValue' ? fix(ch, v, a[0]) : v; return true; },
        get(t, k) { const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; },
      }), ...a));
    };
    ipcMain.handle = function (ch, fn) {
      if (ch === INSTALL) return handle(ch, (e, name, ...a) => { if (BLOCK.has(name)) { slimNote(name, 'install'); return Promise.reject(new Error(`${name} is switched off by Twilight`)); } return fn(e, name, ...a); });
      if (ch === PATHS || ch === ONE) return handle(ch, async (e, ...a) => fix(ch, await fn(e, ...a), a[0]));
      return handle(ch, fn);
    };
  } catch (e) { note('slim hook failed: ' + (e && e.message || e)); }
  try { // every native module Discord asks for at start-up shows on the start-up screen (skipped ones too)
    const h0 = ipcMain.handle.bind(ipcMain);
    ipcMain.handle = function (ch, fn) {
      if (ch !== 'DISCORD_NATIVE_MODULES_INSTALL') return h0(ch, fn);
      return h0(ch, (e, name, ...a) => { boot(`${BLOCK.has(name) ? 'skip' : 'load'} ${String(name).replace(/^discord_/, '')}${BLOCK.has(name) ? ' (slim)' : ''}`); return fn(e, name, ...a); });
    };
  } catch {}
  const slimDisk = () => {
    const { app } = require('electron');
    const appDir = path.dirname(process.execPath), root = path.dirname(appDir), cur = path.basename(appDir);
    const ver = v => (String(v).match(/(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);
    const older = (a, b) => { const x = ver(a), y = ver(b); if (x.length < 3 || y.length < 3) return false; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i]; return false; };
    const size = p => { try { const st = fs.lstatSync(p); return st.isDirectory() ? fs.readdirSync(p).reduce((t, f) => t + size(path.join(p, f)), 0) : st.size; } catch { return 0; } };
    let freed = 0, n = 0, failed = 0;
    const del = p => { const b = size(p); try { fs.rmSync(p, { recursive: true, force: true }); freed += b; n++; } catch { failed++; } };
    if (!/^app-\d/.test(cur)) return note(`slim disk ${CHANNEL}: not in an app-* folder, left alone`);
    try { for (const d of fs.readdirSync(root)) if (/^app-\d/.test(d) && d !== cur && older(d, cur)) del(path.join(root, d)); } catch {}
    try { const pk = path.join(root, 'packages'); for (const f of fs.readdirSync(pk)) if (/\.nupkg$/i.test(f) && older(f, cur)) del(path.join(pk, f)); } catch {}
    const loc = String(app.getLocale() || 'en-US').toLowerCase(), keep = new Set(['en-us', 'en-gb', loc, loc.split('-')[0]]);
    try { const dir = path.join(appDir, 'locales'); for (const f of fs.readdirSync(dir)) if (/\.pak$/i.test(f) && !keep.has(f.slice(0, -4).toLowerCase())) del(path.join(dir, f)); } catch {}
    if (n || failed) note(`slim disk ${CHANNEL}: removed ${n}${failed ? `, ${failed} in use` : ''}, freed ${Math.round(freed / 1048576)} MB`);
  };

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
    const opts = { version: json('manifest.json').version || '?', debugKey: cfg.debugKey, safe, sizes, hasKey: false };
    const seed = JSON.stringify(json('settings.json')).replace(/</g, '\\u003c');
    const body = `${read('core.js')}\n${read('debug.js')}\n${plugins}`;
    opts.kb = Math.round((body.length + css.length) / 1024);
    // sourceURL names the bundle in DevTools, stack traces and CPU profiles (otherwise it shows up as an anonymous script).
    return `window.__twSeed=${seed};\n${body}\nTwilight.start(${JSON.stringify(css)},${JSON.stringify(opts)});\n//# sourceURL=twilight-bundle.js`;
  };

  // ---- Start-up screen (1.18.0): Discord's small "Starting…" window, restyled the moment Twilight loads (about half a second
  // in; Discord opens it before any mod can run, so the very first frame can still be Discord's). Only CSS plus a small text
  // swap, so Discord's own updates keep working inside it. config.json "splash": { on, logo: 'moon' | 'discord' | 'custom', text }.
  // A custom image (PNG, JPG, GIF, WebP) is saved as splash/custom.<ext> next to the mod.
  const splashCfg = () => { const v = json('config.json').splash; return { on: true, logo: 'moon', text: '', log: true, ...(v && typeof v === 'object' ? v : {}) }; };
  const splashImg = () => { try { const f = fs.readdirSync(path.join(__dirname, 'splash')).find(n => /^custom\.(png|jpe?g|gif|webp)$/i.test(n)); return f ? path.join(__dirname, 'splash', f) : null; } catch { return null; } };
  const MOON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fbff"/><stop offset="1" stop-color="#8fc9f5"/></linearGradient></defs>'
    + '<path d="M128 28a76 76 0 1 0 44 118A62 62 0 0 1 128 28z" fill="url(#m)"/><circle cx="150" cy="62" r="4" fill="#dff4ff"/><circle cx="166" cy="98" r="2.6" fill="#b9ecff"/><circle cx="136" cy="40" r="2" fill="#b9ecff"/></svg>';
  const splashCss = () => {
    const c = splashCfg(), img = c.logo === 'custom' && splashImg(), label = `Twilight-${{ ptb: 'PTB', stable: 'Stable', canary: 'Canary' }[CHANNEL]} · v${json('manifest.json').version || '?'}`;
    const logo = c.logo === 'discord' ? '' : `.splash-inner img{display:none!important}
.splash-inner::before{content:'';display:block;width:${img ? 170 : 140}px;height:${img ? 170 : 140}px;margin:6px auto 40px;border-radius:${img ? 16 : 0}px;
 background:url(${JSON.stringify(img ? require('url').pathToFileURL(img).href + '?' + fs.statSync(img).mtimeMs : 'data:image/svg+xml;base64,' + Buffer.from(MOON_SVG).toString('base64'))}) center/${img ? 'cover' : 'contain'} no-repeat;
 ${img ? '' : 'animation:twMoon 3.6s ease-in-out infinite;'}filter:drop-shadow(0 0 16px rgba(108,200,255,.4))}
@keyframes twMoon{0%,100%{transform:translateY(0) rotate(-5deg);filter:drop-shadow(0 0 10px rgba(108,200,255,.3))}50%{transform:translateY(-7px) rotate(3deg);filter:drop-shadow(0 0 26px rgba(108,200,255,.65))}}
.splash-text{top:0!important}`;
    return `html,body,#splash{background:radial-gradient(130% 95% at 50% 10%,#17305c 0%,#0b1430 42%,#07070d 100%)!important}
#splash::before{content:'';position:absolute;inset:0;pointer-events:none;animation:twStars 3.2s ease-in-out infinite alternate;
 background-image:radial-gradient(1.2px 1.2px at 14% 22%,#fff,transparent),radial-gradient(1px 1px at 82% 16%,#cfeaff,transparent),radial-gradient(1.4px 1.4px at 72% 70%,#fff,transparent),radial-gradient(1px 1px at 24% 78%,#b9ecff,transparent),radial-gradient(1px 1px at 52% 8%,#fff,transparent),radial-gradient(1.2px 1.2px at 90% 46%,#dff4ff,transparent),radial-gradient(1px 1px at 8% 52%,#fff,transparent)}
@keyframes twStars{from{opacity:.35}to{opacity:.95}}
${logo}
.splash-status{color:#e6f6ff!important;letter-spacing:.01em}
.splash-text>span:not(.splash-status){color:#7f9bb5!important}
.progress .progress-bar{background:rgba(108,200,255,.12)!important}.progress .complete{background:linear-gradient(90deg,#3d7bfd,#6cc8ff)!important;box-shadow:0 0 8px rgba(108,200,255,.45)!important}
${splashCfg().log ? `#splash{padding-bottom:66px!important}
#tw-boot{position:fixed;left:18px;right:18px;bottom:40px;z-index:3001;pointer-events:none;text-align:center;font:10.5px/14px Consolas,"Cascadia Mono",Menlo,monospace;color:rgba(185,236,255,.34)}
#tw-boot div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:twIn .25s ease-out}
#tw-boot div::before{content:'> ';color:rgba(108,200,255,.45)}
#tw-boot div:last-child{color:rgba(223,244,255,.82)}#tw-boot div:last-child::after{content:'_';animation:twBlink 1s steps(1) infinite}
@keyframes twBlink{50%{opacity:0}}@keyframes twIn{from{opacity:0;transform:translateY(4px)}}` : ''}
#splash::after{content:${JSON.stringify(label.toUpperCase())};position:absolute;bottom:13px;left:0;right:0;text-align:center;font:700 10px var(--primary-font);letter-spacing:.18em;color:rgba(185,236,255,.5)}`;
  };
  // Custom text replaces Discord's status line ("Starting…", "Checking for updates…"); the progress line under it stays Discord's.
  const splashJs = (text, log) => `(() => {
    if (${!!log} && !document.getElementById('tw-boot')) { const box = document.createElement('div'); box.id = 'tw-boot'; document.body.appendChild(box);
      window.__twBoot = s => { const l = document.createElement('div'); l.textContent = s; box.appendChild(l); while (box.children.length > 3) box.firstChild.remove(); };
      for (const s of ${JSON.stringify(bootSteps.slice(-3))}) __twBoot(s); }
    const t = ${JSON.stringify(String(text || '').slice(0, 60))}; if (!t) return;
    const fix = () => { const s = document.querySelector('.splash-status'); if (s && s.textContent !== t) s.textContent = t; };
    fix(); new MutationObserver(fix).observe(document.getElementById('splash-mount') || document.body, { childList: true, subtree: true, characterData: true }); })();`;
  const styledSplash = new WeakSet();
  const styleSplash = w => {
    try {
      const wc = w.webContents; if (styledSplash.has(wc) || !/\/splash\/index\.html$/i.test(decodeURIComponent(require('url').parse(wc.getURL()).pathname || ''))) return;
      const c = splashCfg(); if (!c.on) return; styledSplash.add(wc);
      wc.insertCSS(splashCss()).then(() => wc.executeJavaScript(splashJs(c.text, c.log))).then(() => { if (c.log) bootSinks.add(wc); }).catch(() => {});
    } catch {}
  };
  try {
    const { BrowserWindow, app: eApp } = require('electron');
    for (const w of BrowserWindow.getAllWindows()) { styleSplash(w); w.webContents.once('dom-ready', () => styleSplash(w)); }
    eApp.on('browser-window-created', (_, w) => w.webContents.once('dom-ready', () => styleSplash(w)));
  } catch (e) { note('splash style failed: ' + (e && e.message || e)); }

  // ---- windows: the first big window is the main one; every window made after it (video / chat pop-outs and the like) is a pop-out.
  // Pop-outs can be hidden from screen capture (config.json "hidePopouts", default true; menu: Tools > Housekeeping).
  // (Window glass, the see-through window and the custom snapper were removed in 1.12.0: the main window is Discord's normal window.)
  const popouts = new Set(); let mainWin = null;
  const hideOn = () => json('config.json').hidePopouts !== false;
  // Windows are picked up through Electron's own 'browser-window-created' event. (Up to 1.15.9 this swapped in a BrowserWindow
  // subclass, which hid every window from BrowserWindow.fromId / getAllWindows, so Discord's minimise / maximise / close did nothing.)
  try {
    // Discord stores its main window's id in global.mainWindowId right after creating it, so sort windows one tick later.
    require('electron').app.on('browser-window-created', (_, w) => setImmediate(() => {
      if (w.isDestroyed()) return;
      if (w.id === global.mainWindowId) {
        mainWin = w; w.once('closed', () => { if (mainWin === w) mainWin = null; });
        boot('opening main window');
        w.webContents.once('did-start-loading', () => boot('loading ' + (CHANNEL === 'stable' ? '' : CHANNEL + '.') + 'discord.com'));
        w.webContents.once('dom-ready', () => boot('page loaded'));
        return;
      }
      if (!mainWin) return; // splash / updater windows
      popouts.add(w); w.once('closed', () => popouts.delete(w));
      try { if (hideOn()) w.setContentProtection(true); } catch {}
    }));
  } catch (e) { console.error('[twilight] window watch failed', e); }
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
  // Other translators (Translate page > Translator). DeepL needs your own free key (kept in Twilight's settings on this PC, sent only to
  // DeepL). If DeepL fails, Google takes over so a click never comes back empty.
  const DL_TO = { en: 'EN-GB', pt: 'PT-PT', 'zh-CN': 'ZH-HANS' };
  const deeplHost = key => /:fx$/.test(key) ? 'api-free.deepl.com' : 'api.deepl.com';
  const deepl = async (text, to, key) => {
    if (!key) return { error: 'no DeepL key' };
    const body = JSON.stringify({ text: [text], target_lang: DL_TO[to] || to.toUpperCase() });
    const r = await httpsJson(`https://${deeplHost(key)}/v2/translate`, { method: 'POST', headers: { Authorization: 'DeepL-Auth-Key ' + key, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, body });
    const tr = r.json?.translations?.[0];
    if (!tr) return { error: r.status === 403 ? 'DeepL key not accepted' : r.status === 456 ? 'DeepL monthly limit reached' : r.status === 429 ? 'DeepL is rate limiting' : 'DeepL ' + (r.status || r.error), limited: r.status === 429 || r.status === 456 };
    return { text: tr.text, from: String(tr.detected_source_language || '').toLowerCase() };
  };
  const deeplUsage = async key => {
    if (!key) return { error: 'no key' };
    const r = await httpsJson(`https://${deeplHost(key)}/v2/usage`, { headers: { Authorization: 'DeepL-Auth-Key ' + key } });
    return r.json && 'character_count' in r.json ? { used: r.json.character_count, limit: r.json.character_limit } : { error: r.status === 403 ? 'key not accepted' : 'HTTP ' + (r.status || r.error) };
  };
  const translateWith = async (engine, text, to, key) => {
    if (engine === 'deepl') {
      const r = await deepl(text, to, key).catch(e => ({ error: String(e?.message || e) }));
      if (!r.error) return { ...r, engine };
      const g = await translate(text, to); return g.error ? { error: r.error, limited: !!(r.limited || g.limited) } : { ...g, engine: 'google', fellBack: r.error, limited: !!r.limited };
    }
    return { ...(await translate(text, to)), engine: 'google' };
  };
  const translate = async (text, to) => {
    const r = await httpsJson(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`);
    if (!r.json) return { error: r.status === 429 ? 'Google is rate limiting (HTTP 429)' : r.error || 'HTTP ' + r.status, limited: r.status === 429 };
    return { text: (r.json[0] || []).map(p => p[0]).join(''), from: r.json[2] };
  };


  // The Theme tab asks for window changes through here (only these few keys, nothing else is writable).
  ipcMain.handle('twilight:cmd', async (e, c) => {
    if (c?.type === 'win' && ['minimize', 'maximize', 'close'].includes(c.op)) { // the Window buttons plugin (top right)
      try {
        const w = require('electron').BrowserWindow.fromWebContents(e.sender) || mainWin; if (!w || w.isDestroyed()) return { ok: false };
        if (c.op === 'minimize') w.minimize(); else if (c.op === 'close') w.close(); else if (w.isMaximized()) w.unmaximize(); else w.maximize();
        return { ok: true };
      } catch (err) { return { ok: false, error: String(err.message || err).slice(0, 100) }; }
    }
    // Quest lock: Stable and PTB run the same account, so only one open Discord may run the quest completer. The lock file names the
    // Discord holding it; it counts as free when that Discord's process is gone or has not renewed it for 90 s.
    if (c?.type === 'questLock' && ['take', 'release'].includes(c.op)) {
      const f = 'quest.lock', now = Date.now(), cur = json(f);
      let alive = false; try { if (cur.pid) { process.kill(cur.pid, 0); alive = true; } } catch {}
      const mine = cur.channel === CHANNEL && cur.pid === process.pid, held = !mine && alive && cur.channel && now - (cur.at || 0) < 90000;
      if (c.op === 'release') { if (mine) try { fs.rmSync(path.join(__dirname, f), { force: true }); } catch {} return { ok: true }; }
      if (held) return { ok: false, holder: cur.channel };
      try { writeAtomic(f, JSON.stringify({ channel: CHANNEL, pid: process.pid, at: now })); } catch (e) { return { ok: true, warn: String(e.message || e).slice(0, 80) }; }
      return { ok: true, holder: CHANNEL };
    }
    // Compare page: start a stock run of THIS Discord (it measures itself, then comes back with Twilight), or read the results.
    if (c?.type === 'compare') {
      if (c.op === 'start') { try { fs.writeFileSync(path.join(__dirname, `stock-${CHANNEL}.flag`), 'one start of plain Discord, measured'); } catch (err) { return { ok: false, error: String(err.message || err).slice(0, 80) }; } setTimeout(() => restart('compare with stock'), 400); return { ok: true }; }
      return { ...json(`reports/compare-${CHANNEL}.json`), channel: CHANNEL, waiting: compareWaiting };
    }
    if (c?.type === 'splash') {
      if (c.set && typeof c.set === 'object') {
        const cfg = jsonStrict('config.json'); if (!cfg) return { ok: false, error: 'config.json unreadable, left alone' };
        const v = { ...splashCfg() };
        if (typeof c.set.on === 'boolean') v.on = c.set.on;
        if (['moon', 'discord', 'custom'].includes(c.set.logo)) v.logo = c.set.logo;
        if (typeof c.set.log === 'boolean') v.log = c.set.log;
        if (typeof c.set.text === 'string') v.text = c.set.text.replace(/[\r\n]+/g, ' ').slice(0, 60);
        cfg.splash = v; writeAtomic('config.json', JSON.stringify(cfg, null, 2));
      }
      // A picture chosen in the menu arrives as a data: URL (8 MB at most) and replaces the previous one.
      if (typeof c.image === 'string') {
        const m = /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=]+)$/.exec(c.image); if (!m) return { ok: false, error: 'PNG, JPG, GIF or WebP only' };
        const buf = Buffer.from(m[2], 'base64'); if (buf.length > 8 * 1048576) return { ok: false, error: 'over 8 MB' };
        const dir = path.join(__dirname, 'splash'); fs.mkdirSync(dir, { recursive: true });
        for (const n of fs.readdirSync(dir)) if (/^custom\./i.test(n)) try { fs.rmSync(path.join(dir, n), { force: true }); } catch {}
        fs.writeFileSync(path.join(dir, 'custom.' + (m[1] === 'jpeg' ? 'jpg' : m[1])), buf);
        const cfg = jsonStrict('config.json'); if (cfg) { cfg.splash = { ...splashCfg(), logo: 'custom' }; writeAtomic('config.json', JSON.stringify(cfg, null, 2)); }
      }
      return { ...splashCfg(), hasImage: !!splashImg() };
    }
    if (c?.type === 'slim') {
      if (['games', 'krisp', 'disk'].includes(c.key) && typeof c.on === 'boolean') {
        const cfg = jsonStrict('config.json'); if (!cfg) return { ok: false, error: 'config.json unreadable, left alone' };
        cfg.slim = { ...(cfg.slim && typeof cfg.slim === 'object' ? cfg.slim : {}), [c.key]: c.on }; writeAtomic('config.json', JSON.stringify(cfg, null, 2));
      }
      return { saved: slimCfg(), running: { ...SLIM }, blocked: [...BLOCK] };
    }
    if (c?.type === 'status') return { mode: 'off', hidePopouts: hideOn(), popouts: popouts.size };
    if (c?.type === 'popouts' && typeof c.on === 'boolean') {
      const cfg = jsonStrict('config.json'); if (!cfg) return { ok: false, error: 'config.json unreadable, left alone' };
      cfg.hidePopouts = c.on; writeAtomic('config.json', JSON.stringify(cfg, null, 2));
      for (const w of popouts) { try { if (!w.isDestroyed()) w.setContentProtection(c.on); } catch {} }
      return { on: c.on, popouts: popouts.size };
    }
    if (c?.type === 'metrics') return metrics();
    if (c?.type === 'translate' && c.op === 'usage') return deeplUsage(c.key);
    if (c?.type === 'translate' && typeof c.text === 'string' && c.text.length < 3000 && /^[\w-]{2,8}$/.test(c.to || '')) return translateWith(c.engine, c.text, c.to, c.key);
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
      restart(c.on ? 'menu: safe mode' : 'menu: leave safe mode');
    }
    if (c?.type === 'relaunch') restart('menu');
    // What's new: the changelog sections between two versions (from < v <= to), or the newest few. Plain text, parsed in the page.
    if (c?.type === 'changelog') {
      const ver = v => String(v || '0').split('.').map(n => parseInt(n, 10) || 0), cmp = (a, b) => { const x = ver(a), y = ver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
      const parts = read('CHANGELOG.md').split(/^## +/m).slice(1).map(b => { const nl = b.indexOf('\n'); return { version: b.slice(0, nl).trim(), body: b.slice(nl + 1).trim() }; })
        .filter(e => /^\d+\.\d+\.\d+$/.test(e.version));
      const list = c.from ? parts.filter(e => cmp(e.version, c.from) > 0 && cmp(e.version, c.to || '999.0.0') <= 0) : parts.slice(0, Math.max(1, Math.min(10, c.count | 0 || 3)));
      return { entries: list.slice(0, 12).map(e => ({ version: e.version, body: e.body.slice(0, 8000) })), total: parts.length };
    }
    // Coming soon (menu > Home): COMING_SOON.md from the GitHub repo, so everyone sees what the next update brings before it lands.
    // Fetched at most every 30 minutes; the copy next to the mod is the fallback (offline, or a dev build not pushed yet).
    if (c?.type === 'coming') {
      const now = Date.now(); if (comingCache && now - comingCache.at < 1800000) return comingCache.r;
      let text = null, from = null;
      if (isDev(json('manifest.json').version)) { const l = read('COMING_SOON.md'); if (l) { text = l; from = 'local'; } } // a dev build shows its own list (GitHub's only changes when a release is announced)
      if (!text) try { const { repo, branch = 'main', token } = json('config.json'); if (repo) { text = (await get(`https://api.github.com/repos/${repo}/contents/COMING_SOON.md?ref=${encodeURIComponent(branch)}`, token)).toString('utf8'); from = 'github'; } } catch {}
      if (!text) { const local = read('COMING_SOON.md'); if (local) { text = local; from = 'local'; } }
      const r = { text: text ? text.slice(0, 8000) : null, from }; comingCache = { at: now, r }; return r;
    }
    // Feedback (menu footer): reports go to the Twilight feedback channel through a Discord webhook, so nobody needs to sign in anywhere.
    // Where to send comes from feedback.json in the public repo (so a spammed webhook can be swapped without a release), else the copy
    // next to the mod. Only webhook URLs on discord.com are accepted, and the post can never ping anyone.
    if (c?.type === 'feedback') {
      const now = Date.now();
      if (!fbCache || now - fbCache.at > 1800000) {
        let cfg = null;
        try { const r = await httpsJson('https://api.github.com/repos/Decuwu/twilight-cord-public/contents/feedback.json', { headers: { Accept: 'application/vnd.github.raw+json' } }); if (r.json?.hook) cfg = r.json; } catch {}
        if (!cfg) { const l = json('feedback.json'); if (l?.hook) cfg = l; }
        fbCache = { at: now, cfg };
      }
      const cfg = fbCache.cfg, ok = cfg && /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(cfg.hook);
      if (c.op === 'where') return { ok: !!ok, channel: cfg?.channel || null, guild: cfg?.guild || null };
      if (c.op !== 'send' || !c.payload) return { ok: false, error: 'bad request' };
      if (!ok) return { ok: false, error: 'Feedback is not set up yet' };
      const p = c.payload, e = p.embeds?.[0] || {};
      const body = JSON.stringify({ username: 'Twilight Feedback', allowed_mentions: { parse: [] },
        embeds: [{ title: String(e.title || '').slice(0, 256), description: String(e.description || '').slice(0, 3500), color: e.color | 0, timestamp: new Date().toISOString(),
          fields: (e.fields || []).slice(0, 5).map(f => ({ name: String(f.name).slice(0, 256), value: String(f.value || '-').slice(0, 1000), inline: !!f.inline })), footer: { text: 'Sent from the Twilight menu' } }] });
      const r = await httpsJson(cfg.hook + '?wait=true', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, body });
      return r.status >= 200 && r.status < 300 ? { ok: true } : { ok: false, error: r.status === 429 ? 'Too many reports right now, try again in a minute' : 'Could not send (' + (r.status || r.error) + ')' };
    }
    if (c?.type === 'boot' && typeof c.step === 'string') { boot(c.step); return { ok: true }; }
    if (c?.type === 'ready') { note(`page ready ${CHANNEL} v${json('manifest.json').version || '?'}`); return { ok: true }; }
    return null;
  });

  // ---- auto updater: pulls manifest.json + listed files from the (private) GitHub repo ----
  const SAFE = /^(core\.js|debug\.js|twilight\.js|measure\.js|stock\.js|CHANGELOG\.md|feedback\.json|plugins\/[\w-]+\.js|themes\/[\w-]+\.css)$/;
  // Versions: "1.19.0" is a release (on GitHub); "1.19.0.d3" is local dev build 3 of what will be released as 1.19.0.
  const isDev = v => /\.d\d*$/i.test(String(v || ''));
  const num = x => parseInt(x, 10) || 0; // "13-beta" counts as 13
  const newer = (a, b) => {
    const x = String(a).split('.').map(num), y = String(b).split('.').map(num);
    for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    return isDev(b) && !isDev(a); // a release beats the local dev builds of the same number (1.19.0 > 1.19.0.d3)
  };
  let comingCache = null, fbCache = null;
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
    // Also re-fetch when a listed file is missing: up to 1.18.0 the updater skipped measure.js, stock.js and CHANGELOG.md.
    const local = json('manifest.json'), missing = (local.files || []).some(f => SAFE.test(f) && !fs.existsSync(path.join(__dirname, f)));
    if (!newer(remote.version, local.version || '0') && !(missing && remote.version === local.version)) return null;
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
  const hookText = (D = __dirname) => [
    '// Twilight hook (in a module, so Discord\'s own updates can still patch app.asar)',
    `const __fs = require('fs'), __LOG = ${JSON.stringify(path.join(D, 'reports', 'launch.txt'))};`,
    "const __note = s => { try { __fs.appendFileSync(__LOG, new Date().toISOString() + ' ' + s + '\\n'); } catch (e) {} };",
    "__note('core hook ran');",
    // A stock-<channel>.flag next to the mod gives ONE start of plain Discord (Twilight not loaded), for comparing against stock.
    // The flag is renamed to .used on the way, so the next start is back to normal by itself.
    `const __ch = (b => b.includes('ptb') ? 'ptb' : b.includes('canary') ? 'canary' : 'stable')(require('path').basename(process.execPath).toLowerCase()), __stock = require('path').join(${JSON.stringify(D)}, 'stock-' + __ch + '.flag');`,
    "let __plain = false; try { if (__fs.existsSync(__stock)) { __fs.renameSync(__stock, __stock + '.used'); __plain = true; __note('stock start ' + __ch + ' (Twilight not loaded)'); } } catch (e) {}",
    `if (__plain) try { require(${JSON.stringify(path.join(D, 'stock.js'))})(__ch); } catch (e) { __note('stock.js FAILED: ' + (e && e.message || e)); }`,
    `if (!__plain) try { require(${JSON.stringify(path.join(D, 'twilight.js'))}); __note('twilight.js loaded'); } catch (e) { __note('twilight.js FAILED: ' + (e && e.stack || e)); }`,
    "module.exports = require('./core.asar');", ''].join('\n');
  const verCmp = (a, b) => { const x = a.replace('app-', '').split('.').map(num), y = b.replace('app-', '').split('.').map(num); for (let i = 0; i < 4; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
  const ensureHook = (base, D = __dirname) => { // D: the mod folder this Discord loads from
    try {
      const app = fs.readdirSync(base).filter(x => /^app-\d/.test(x)).sort(verCmp).pop(); if (!app) return;
      const mods = path.join(base, app, 'modules'), core = fs.readdirSync(mods).filter(x => x.startsWith('discord_desktop_core')).sort().pop(); if (!core) return;
      const dir = path.join(mods, core, 'discord_desktop_core'), f = path.join(dir, 'index.js');
      if (!fs.existsSync(path.join(dir, 'core.asar'))) return; // the module is not fully in place yet: the next attempt will do it
      const cur = fs.readFileSync(f, 'utf8');
      if (cur.includes(HOOK_MARK)) { if (cur !== hookText(D)) fs.writeFileSync(f, hookText(D)); return; } // ours: brought up to date when the template changes
      if (!/^\s*module\.exports\s*=\s*require\(\s*['"]\.\/core\.asar['"]\s*\)\s*;?\s*$/.test(cur)) { // not Discord's usual one-liner: leave it, say so once
        fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });
        if (!fs.existsSync(path.join(__dirname, 'reports', 'hook-skipped.txt'))) fs.writeFileSync(path.join(__dirname, 'reports', 'hook-skipped.txt'), `${new Date().toISOString()} ${app}: index.js is not the usual one-liner, left alone. Run the launcher to repair.\n`);
        return;
      }
      fs.writeFileSync(f, hookText(D));
      fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });
      fs.appendFileSync(path.join(__dirname, 'reports', 'launch.txt'), `${new Date().toISOString()} hook put back into ${path.basename(base)}/${app}\n`);
    } catch {}
  };
  const keepHook = () => {
    const local = process.env.LOCALAPPDATA; if (!local) return;
    // PTB can have its own copy of the mod in a "ptb" folder next to this one (pinned to the public build). That copy only looks after PTB;
    // this folder keeps Stable and Canary, and also puts PTB's hook back (pointing at the ptb copy) if PTB updated while it was not running.
    const own = path.basename(__dirname).toLowerCase() === 'ptb', ptbCopy = !own && fs.existsSync(path.join(__dirname, 'ptb', 'twilight.js')) ? path.join(__dirname, 'ptb') : null;
    for (const d of ['Discord', 'DiscordPTB', 'DiscordCanary']) {
      if (own && d !== 'DiscordPTB') continue;
      const D = d === 'DiscordPTB' && ptbCopy ? ptbCopy : __dirname;
      const base = path.join(local, d); if (!fs.existsSync(base)) continue;
      ensureHook(base, D);
      let t = 0;
      try { fs.watch(base, { persistent: false }, (ev, name) => { if (!/^app-/.test(String(name || 'app-'))) return; clearTimeout(t); t = setTimeout(() => { ensureHook(base, D); setTimeout(() => ensureHook(base, D), 30000); setTimeout(() => ensureHook(base, D), 120000); }, 5000); }); } catch {}
    }
  };

  let pending, delivered = false;
  const { app, session } = require('electron');
  ipcMain.on('twilight:code', e => { const code = build(); e.returnValue = code; boot(`injecting twilight (${Math.round(code.length / 1024)} KB)`); });
  ipcMain.handle('twilight:update', async () => {
    const r = await pending;
    if (delivered) return null;
    delivered = true;
    return r;
  });
  app.whenReady().then(() => {
    try { keepHook(); } catch {}
    note(`started ${CHANNEL} ${path.basename(path.dirname(process.execPath))} v${json('manifest.json').version || '?'}`);
    // After a stock run (Compare page), measure this Discord WITH Twilight the same way: same wait, same length.
    try {
      const cmp = json(`reports/compare-${CHANNEL}.json`);
      if (cmp.stock && !cmp.twilight) {
        compareWaiting = true; const M = require('./measure.js'), t0 = Date.now();
        setTimeout(async () => {
          const r = await M.run(path.basename(process.execPath).replace(/\.exe$/i, ''), M.SECS); compareWaiting = false;
          try { M.save(__dirname, CHANNEL, 'twilight', { ...r, firstRenderMs: await M.firstRender(), at: new Date().toISOString(), afterS: Math.round((Date.now() - t0) / 1000) - (r.secs || M.SECS), version: json('manifest.json').version, slim: { ...SLIM } }); } catch {}
          note(`twilight measured ${CHANNEL}: ${r.ramMB} MB, ${r.cpuPct}% CPU, ${r.procs} processes`);
        }, M.WAIT * 1000).unref?.();
      }
    } catch {}
    if (SLIM.disk) setTimeout(() => { try { slimDisk(); } catch (e) { note('slim disk failed: ' + (e && e.message || e)); } }, 60000).unref?.();
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
  webFrame.executeJavaScript(ipcRenderer.sendSync('twilight:code')).then(() => ipcRenderer.invoke('twilight:cmd', { type: 'ready' }), () => {});
  ipcRenderer.invoke('twilight:update').then(r => {
    if (!r) return;
    const msg = r.error ? ['Update check failed', r.error.slice(0, 60), 'error']
      : ['Updated', `v${r.updated} · ${r.restart ? 'restart Discord' : 'press Ctrl+R'} to apply`, 'success'];
    webFrame.executeJavaScript(`Twilight.notify(${JSON.stringify(msg[0])},${JSON.stringify(msg[1])},6000,${JSON.stringify(msg[2])})`);
  }).catch(() => {});
}
