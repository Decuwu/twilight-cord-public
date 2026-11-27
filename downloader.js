// /download engine (Discord's main process). Loaded the first time /download is used, never at start-up.
// Fetches yt-dlp, ffmpeg/ffprobe and deno into %APPDATA%\twilight-cord\bin on first use (shared by Stable and PTB),
// downloads the link on THIS PC, turns the result into a Discord-friendly file that fits your upload limit, and hands it to the page.
// Nothing goes anywhere except the site the link points to, and GitHub (to fetch/update the tools).
// Approach modelled on the MediaDrop Vencord plugin a friend shared; this is our own code.
const fs = require('fs'), fsp = fs.promises, path = require('path'), os = require('os'), cp = require('child_process');

const ROOT = path.join(process.env.APPDATA || os.homedir(), 'twilight-cord');
const BIN = path.join(ROOT, 'bin');
const TMP = path.join(os.tmpdir(), 'twilight-dl');
const CLIP = path.join(TMP, '_clip'); // the last result, kept so the clipboard copy stays pasteable
const LOG = path.join(ROOT, 'reports', 'download.txt');
// Windows' own tools by full path: Discord's main process doesn't always have System32 on its PATH.
const SYS = path.join(process.env.SystemRoot || process.env.windir || 'C:\\Windows', 'System32');
const TAR = path.join(SYS, 'tar.exe'), PS = path.join(SYS, 'WindowsPowerShell', 'v1.0', 'powershell.exe'), TASKKILL = path.join(SYS, 'taskkill.exe');

const TOOLS = [
  { name: 'yt-dlp', files: ['yt-dlp.exe'], url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' },
  { name: 'ffmpeg', files: ['ffmpeg.exe', 'ffprobe.exe'], url: 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip', zip: true },
  { name: 'deno', files: ['deno.exe'], url: 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip', zip: true },
];
const exe = n => path.join(BIN, n + '.exe');
const have = t => t.files.every(f => fs.existsSync(path.join(BIN, f)));

// A value inside a PowerShell single-quoted string. PowerShell also treats the curly quotes U+2018 to U+201B as quote marks, so all are doubled.
const psq = s => `'${String(s).replace(/['\u2018\u2019\u201a\u201b]/g, '$&$&')}'`;

const log = s => { try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, `${new Date().toISOString()} ${s}\n`); const st = fs.statSync(LOG); if (st.size > 400000) fs.writeFileSync(LOG, fs.readFileSync(LOG, 'utf8').slice(-200000)); } catch {} };

// ---------------------------------------------------------------- processes
function run(bin, args, o = {}) {
  return new Promise((resolve, reject) => {
    let p; try { p = cp.spawn(bin, args, { windowsHide: true, cwd: o.cwd || TMP, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } }); } catch (e) { return reject(e); }
    let out = '', err = '';
    const kill = () => { try { cp.execFile(TASKKILL, ['/PID', String(p.pid), '/T', '/F'], { windowsHide: true }, () => {}); } catch {} };
    const t = o.timeout ? setTimeout(kill, o.timeout) : null;
    const abort = () => kill(); o.signal?.addEventListener('abort', abort);
    p.stdout.setEncoding('utf8'); p.stderr.setEncoding('utf8'); // whole characters, never half of one
    const feed = which => { let buf = ''; return d => { const s = String(d); if (which === 'out') out = (out + s).slice(-300000); else err = (err + s).slice(-300000); buf += s; const parts = buf.split(/\r?\n|\r/); buf = parts.pop(); for (const l of parts) if (l.trim()) o.line?.(l, which); }; };
    p.stdout.on('data', feed('out')); p.stderr.on('data', feed('err'));
    const fin = () => { clearTimeout(t); o.signal?.removeEventListener('abort', abort); };
    p.on('error', e => { fin(); reject(e); });
    p.on('close', code => { fin(); if (code === 0) resolve({ out, err }); else reject(Object.assign(new Error(`${path.basename(bin)} exited with ${code}`), { out, err })); });
  });
}

// ---------------------------------------------------------------- tools
const setup = { state: 'idle', step: '', pct: 0, error: '' };
let setupP = null;

async function fetchTo(url, dest, onPct) {
  const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'twilight-cord' } });
  if (!r.ok || !r.body) throw new Error(`download failed (${r.status})`);
  const total = +r.headers.get('content-length') || 0; let done = 0;
  const f = fs.createWriteStream(dest);
  try {
    for await (const chunk of r.body) { done += chunk.length; onPct(total ? done / total : 0); if (!f.write(chunk)) await new Promise(res => f.once('drain', res)); }
  } finally { await new Promise(res => f.end(res)); }
  if (total && done < total) throw new Error('download cut off');
}

async function unzip(zip, files) {
  const dir = zip + '.x'; await fsp.rm(dir, { recursive: true, force: true }); await fsp.mkdir(dir, { recursive: true });
  // Windows 10+ ships bsdtar, which reads zips without loading them into memory; PowerShell as a fallback.
  try { await run(TAR, ['-xf', zip, '-C', dir], { timeout: 300000 }); }
  catch { await run(PS, ['-NoProfile', '-NonInteractive', '-Command', `Expand-Archive -LiteralPath ${psq(zip)} -DestinationPath ${psq(dir)} -Force`], { timeout: 300000 }); }
  const found = new Set();
  const walk = async d => { for (const e of await fsp.readdir(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) await walk(p); else if (files.includes(e.name)) { await fsp.rm(path.join(BIN, e.name), { force: true }); await fsp.rename(p, path.join(BIN, e.name)); found.add(e.name); } } };
  await walk(dir); await fsp.rm(dir, { recursive: true, force: true });
  for (const f of files) if (!found.has(f)) throw new Error(`${f} missing from the download`);
}

async function install(t, i, n) {
  setup.step = `Getting ${t.name}`;
  const tmp = path.join(BIN, `.${t.name}.part`);
  await fetchTo(t.url, tmp, x => { setup.pct = Math.round(((i + x) / n) * 100); });
  if (t.zip) { setup.step = `Unpacking ${t.name}`; await unzip(tmp, t.files); await fsp.rm(tmp, { force: true }); }
  else { await fsp.rm(path.join(BIN, t.files[0]), { force: true }); await fsp.rename(tmp, path.join(BIN, t.files[0])); }
  log(`installed ${t.name}`);
}

async function doSetup() {
  await fsp.mkdir(BIN, { recursive: true }); await fsp.mkdir(TMP, { recursive: true });
  const missing = TOOLS.filter(t => !have(t));
  Object.assign(setup, { state: 'working', step: 'Preparing', pct: 0, error: '' });
  for (let i = 0; i < missing.length; i++) await install(missing[i], i, missing.length);
  // Sites change all the time and break yt-dlp's site support, so keep it fresh (checked once a day).
  const stamp = path.join(BIN, '.updated'), last = await fsp.stat(stamp).then(s => s.mtimeMs, () => 0);
  if (Date.now() - last > 86400000) {
    setup.step = 'Updating yt-dlp';
    await run(exe('yt-dlp'), ['-U'], { timeout: 120000, cwd: BIN }).then(r => log('yt-dlp -U: ' + r.out.trim().split('\n').pop()), e => log('yt-dlp -U failed: ' + e.message));
    await fsp.writeFile(stamp, new Date().toISOString());
  }
  Object.assign(setup, { state: 'ready', step: '', pct: 100 });
}
const ensure = () => {
  if (setup.state === 'ready') return Promise.resolve();
  return setupP ||= doSetup().catch(e => { Object.assign(setup, { state: 'error', step: '', error: String(e.message || e) }); setupP = null; log('setup failed: ' + e.message); throw e; });
};

// ---------------------------------------------------------------- jobs
const jobs = new Map();
const IMG = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const IMG_CONVERT = new Set(['heic', 'heif', 'avif', 'bmp', 'tif', 'tiff', 'jfif']);
const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg' };

const pub = j => ({ id: j.id, status: j.status, stage: j.stage, pct: Math.round(j.pct), error: j.error, site: j.site, title: j.title,
  files: j.files.map(f => ({ path: f.path, name: f.name, mime: f.mime, size: f.size, kind: f.kind, note: f.note || '' })) });
const prog = (j, stage, pct) => { pct = Math.max(0, Math.min(100, pct)); if (j.stage === stage && pct < j.pct) return; j.stage = stage; j.pct = pct; };

function cleanErr(e) {
  const t = `${e?.err || ''}\n${e?.out || ''}`.split('\n').map(l => l.trim()).filter(l => /^ERROR|error:/i.test(l));
  let m = (t.at(-1) || String(e?.message || e)).replace(/^ERROR:\s*(\[[^\]]+\]\s*[\w-]*:\s*)?/i, '').replace(/;?\s*please report this issue.*$/i, '').replace(/\s*Use --cookies.*$/i, '');
  if (/login|log in|sign in|cookies|authenticat|private|rate-limit|age/i.test(m)) m += ' (this post needs you to be signed in: set Cookies in the Download page of the menu)';
  return m.slice(0, 260);
}
async function listFiles(dir) {
  const out = [];
  const walk = async d => { for (const e of (await fsp.readdir(d, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) { const p = path.join(d, e.name); if (e.isDirectory()) await walk(p); else if (!/\.(part|ytdl|json|txt|temp|description|vtt|srt)$/i.test(e.name) && !e.name.includes('.part-')) out.push(p); } };
  await walk(dir).catch(() => {});
  return out;
}

async function ytdlp(j, dir, cookies) {
  const o = j.opts, yt = /youtu\.?be/.test(j.host);
  const filters = ['!is_live']; if (o.maxMin > 0) filters.push(`duration<=?${o.maxMin * 60}`);
  const fmt = o.mode === 'audio' ? ['-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '2']
    : ['-S', `res:${o.maxH},vcodec:h264,acodec:aac,ext:mp4:m4a`, '-f', 'bv*+ba/b', '--merge-output-format', 'mp4'];
  const args = ['--ignore-config', '--encoding', 'utf-8', '--newline', '--no-colors', '--no-mtime', '--restrict-filenames', '--no-part',
    '--js-runtimes', `deno:${exe('deno')}`, ...(yt ? ['--remote-components', 'ejs:github'] : []),
    '--ffmpeg-location', BIN, '-P', dir, '-o', '%(playlist_index|0)03d_%(title).60B.%(ext)s',
    ...fmt, '--match-filter', filters.join(' & '),
    yt ? '--no-playlist' : '--yes-playlist', '--playlist-items', '1:10',
    '--no-simulate', '--progress', '--print', 'before_dl:TWINFO|%(extractor_key)s|%(title).80s',
    '--progress-template', 'download:TWPROG|%(info.playlist_index)s|%(info.n_entries)s|%(progress.filename)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s',
    ...(cookies ? ['--cookies-from-browser', cookies] : []), j.url];
  const parts = new Map();
  await run(exe('yt-dlp'), args, { signal: j.abort.signal, timeout: 30 * 60000, cwd: dir, line: l => {
    if (l.startsWith('TWINFO|')) { const [, site, title] = l.split('|'); j.site ||= site; j.title ||= title; return; }
    if (!l.startsWith('TWPROG|')) { j.log.push(l); if (j.log.length > 200) j.log.shift(); return; }
    const [, idx, n, file, d, t, est] = l.split('|');
    parts.set(file, { d: +d || 0, t: +t || +est || 0 });
    let D = 0, T = 0; for (const p of parts.values()) { D += p.d; T += p.t; }
    const c = +n || 1, i = +idx || 1, item = T ? D / T : 0;
    prog(j, 'downloading', c > 1 ? ((i - 1 + item) / c) * 100 : item * 100);
  } });
  if (!(await listFiles(dir)).length && o.maxMin > 0) throw Object.assign(new Error(`Skipped: longer than ${o.maxMin} minutes (change the limit in the Download page), or a live stream`), { skip: true });
}

async function probe(f) {
  const { out } = await run(exe('ffprobe'), ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', f], { timeout: 60000 });
  const x = JSON.parse(out), v = x.streams.find(s => s.codec_type === 'video' && !s.disposition?.attached_pic), a = x.streams.find(s => s.codec_type === 'audio');
  return { dur: +x.format.duration || +v?.duration || 0, v: v && { codec: v.codec_name, pix: v.pix_fmt, w: v.width, h: v.height, frames: +v.nb_frames || 0 }, a: a && { codec: a.codec_name } };
}

function ffmpeg(j, args, dur, i, n, stage = 'processing') {
  return run(exe('ffmpeg'), ['-hide_banner', '-loglevel', 'error', '-y', '-nostats', '-progress', 'pipe:1', ...args], { signal: j.abort.signal, timeout: 60 * 60000,
    line: l => { const m = l.match(/^out_time_us=(\d+)/); if (m && dur > 0) prog(j, stage, ((i + Math.min(1, m[1] / 1e6 / dur)) / n) * 100); } });
}
const scaleTo = h => `scale='trunc(min(iw,iw*${h}/ih)/2)*2':'trunc(min(ih,${h})/2)*2'`;

async function convert(j, file, i, n) {
  const o = j.opts, limit = o.limitMB * 1e6, target = limit * 0.94, base = path.join(j.dir, `p${i}`);
  let ext = path.extname(file).slice(1).toLowerCase(); if (ext === 'jpeg') ext = 'jpg';
  const res = (p, kind, e, note) => ({ path: p, kind, ext: e, note });
  if (IMG.has(ext) && o.mode !== 'gif') { prog(j, 'processing', ((i + 1) / n) * 100); return res(file, ext === 'gif' ? 'gif' : 'image', ext); }
  let info; try { info = await probe(file); } catch (e) { j.log.push('ffprobe failed: ' + e.message); return null; }
  if (IMG_CONVERT.has(ext) || (info.v && !info.a && info.dur <= 0.05 && info.v.frames <= 1)) { await ffmpeg(j, ['-i', file, '-frames:v', '1', base + '.png'], 0, i, n); return res(base + '.png', 'image', 'png'); }

  if (!info.v || o.mode === 'audio') {
    if (!info.a) return null;
    let out = file, e = ext;
    if (!['mp3', 'm4a', 'ogg'].includes(ext)) { out = base + '.mp3'; e = 'mp3'; await ffmpeg(j, ['-i', file, '-vn', '-c:a', 'libmp3lame', '-q:a', '2', out], info.dur, i, n); }
    if ((await fsp.stat(out)).size > limit && info.dur) { // squeeze the bitrate down until it fits
      const kbps = Math.floor(target * 8 / info.dur / 1000); if (kbps < 32) throw new Error(`Too long to fit in ${o.limitMB} MB even as audio`);
      out = base + '_s.mp3'; e = 'mp3'; await ffmpeg(j, ['-i', file, '-vn', '-c:a', 'libmp3lame', '-b:a', Math.min(kbps, 192) + 'k', out], info.dur, i, n, 'compressing');
    }
    return res(out, 'audio', e);
  }

  if (o.mode === 'gif') {
    for (const [w, fps] of [[480, 20], [360, 15], [280, 12], [220, 10]]) {
      const out = base + `_${w}.gif`;
      await ffmpeg(j, ['-t', '30', '-i', file, '-vf', `fps=${fps},scale='min(${w},iw)':-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, '-loop', '0', out], Math.min(30, info.dur), i, n);
      if ((await fsp.stat(out)).size <= limit) return res(out, 'gif', 'gif', info.dur > 30 ? 'first 30 seconds' : '');
      await fsp.rm(out, { force: true });
    }
    throw new Error(`Couldn't make the GIF small enough for ${o.limitMB} MB`);
  }

  // Video: Discord plays H.264 + AAC in MP4 everywhere (desktop, web, iPhone). Copy when it already is that, else re-encode.
  const v = info.v, ok = v.codec === 'h264' && /^yuvj?420p$/.test(v.pix || '') && v.h <= o.maxH && (!info.a || info.a.codec === 'aac');
  let out = base + '.mp4';
  if (ok) await ffmpeg(j, ['-i', file, '-map', '0:v:0', '-map', '0:a:0?', '-c', 'copy', '-movflags', '+faststart', out], info.dur, i, n);
  else await ffmpeg(j, ['-i', file, '-map', '0:v:0', '-map', '0:a:0?', '-vf', scaleTo(o.maxH), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out], info.dur, i, n);
  let size = (await fsp.stat(out)).size, note = '';
  for (let k = 1, f = 1; size > limit && k <= 3; k++, f *= 0.88) {
    if (!info.dur) throw new Error('Too big, and its length is unknown so it can\'t be shrunk');
    const aK = info.a ? (k === 1 ? 128 : 96) : 0, vK = Math.floor(target * 8 * f / info.dur / 1000 - aK);
    if (vK < 120) throw new Error(`Too long (${Math.round(info.dur / 60)} min) to fit in ${o.limitMB} MB. Try format: Audio`);
    const h = Math.min(o.maxH, vK > 3500 ? 1080 : vK > 1500 ? 720 : vK > 700 ? 480 : vK > 350 ? 360 : 240);
    j.log.push(`shrink ${k}: ${vK} kb/s at <=${h}p`);
    const s = base + `_c${k}.mp4`;
    await ffmpeg(j, ['-i', file, '-map', '0:v:0', '-map', '0:a:0?', '-vf', scaleTo(h), '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', vK + 'k', '-maxrate', Math.floor(vK * 1.25) + 'k', '-bufsize', vK * 2 + 'k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', (aK || 96) + 'k', '-movflags', '+faststart', s], info.dur, i, n, 'compressing');
    await fsp.rm(out, { force: true }); out = s; size = (await fsp.stat(out)).size; note = `shrunk to ${h}p to fit ${o.limitMB} MB`;
  }
  if (size > limit) throw new Error(`Couldn't get it under ${o.limitMB} MB`);
  return res(out, 'video', 'mp4', note);
}

const safeName = (s, ext) => (String(s || 'video').replace(/[\\/:*?"<>|#%&{}$!'@+`=;\u0000-\u001f\u2018-\u201f\u2028\u2029]/g, '').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^[._]+|[._]+$/g, '').slice(0, 60) || 'video') + '.' + ext;

async function work(j) {
  try {
    await ensure();
    j.status = 'downloading'; prog(j, 'downloading', 0);
    const raw = path.join(j.dir, 'raw');
    const tries = j.opts.cookies ? [null, j.opts.cookies] : [null]; // anonymous first; your browser's sign-in only if that fails
    let files = []; const errs = [];
    for (const ck of tries) {
      if (j.abort.signal.aborted) throw new Error('Cancelled');
      const label = 'yt-dlp' + (ck ? ` + ${ck} sign-in` : '');
      try {
        await fsp.rm(raw, { recursive: true, force: true }); await fsp.mkdir(raw, { recursive: true });
        await ytdlp(j, raw, ck);
        files = await listFiles(raw);
        if (files.length) { log(`${j.id} ${j.url} downloaded with ${label}`); break; }
        errs.push('Nothing to download there');
      } catch (e) { if (e.skip) throw e; errs.push(cleanErr(e)); log(`${j.id} ${label} failed: ${cleanErr(e)}`); }
    }
    if (!files.length) throw Object.assign(new Error(errs.at(-1) || 'Nothing to download there'), { clean: true });
    j.status = 'processing'; prog(j, 'processing', 0);
    const out = [];
    for (let i = 0; i < files.length; i++) { if (j.abort.signal.aborted) throw new Error('Cancelled'); const f = await convert(j, files[i], i, files.length); if (f) out.push(f); }
    if (!out.length) throw new Error('Nothing in there Discord can show');
    const title = j.title || j.site || 'download', used = new Set();
    for (let i = 0; i < out.length; i++) {
      const f = out[i]; let name = safeName(out.length > 1 ? `${title}_${i + 1}` : title, f.ext);
      while (used.has(name.toLowerCase())) name = name.replace(/(\.\w+)$/, '_' + i + '$1'); used.add(name.toLowerCase());
      const dest = path.join(j.dir, name); await fsp.rename(f.path, dest);
      Object.assign(f, { path: dest, name, size: (await fsp.stat(dest)).size, mime: MIME[f.ext] || 'application/octet-stream' });
    }
    await fsp.rm(raw, { recursive: true, force: true });
    j.files = out; j.status = 'ready'; prog(j, 'ready', 100);
    log(`${j.id} ready: ${out.map(f => `${f.name} ${(f.size / 1e6).toFixed(2)}MB${f.note ? ' (' + f.note + ')' : ''}`).join(', ')}`);
  } catch (e) {
    j.status = 'error'; j.error = j.abort.signal.aborted ? 'Cancelled' : (e.skip || e.clean ? e.message : cleanErr(e));
    log(`${j.id} ${j.url} FAILED: ${j.error}${j.log.length ? '\n    ' + j.log.slice(-6).join('\n    ') : ''}`);
  }
}

function inTmp(p) { const n = path.normalize(String(p)); if (!n.startsWith(TMP + path.sep)) throw new Error('outside the download folder'); return n; }

// Puts the files on the Windows clipboard as files (like copying them in Explorer), so Ctrl+V works in any app.
async function clip(paths) {
  await fsp.rm(CLIP, { recursive: true, force: true }); await fsp.mkdir(CLIP, { recursive: true });
  const kept = [];
  for (const p of paths) { const d = path.join(CLIP, path.basename(p)); await fsp.copyFile(inTmp(p), d); kept.push(d); }
  const list = kept.map(psq).join(',');
  await run(PS, ['-NoProfile', '-NonInteractive', '-STA', '-Command', `Set-Clipboard -LiteralPath ${list}`], { timeout: 20000 });
  return true;
}

// Old leftovers (a crash mid-download, an unsent job) are cleared once per run.
let swept = false;
const sweep = async () => { if (swept) return; swept = true; try { for (const n of await fsp.readdir(TMP)) { if (n === '_clip') continue; const p = path.join(TMP, n), s = await fsp.stat(p); if (Date.now() - s.mtimeMs > 6 * 3600000) await fsp.rm(p, { recursive: true, force: true }); } } catch {} };

exports.cmd = async c => {
  try {
    switch (c.op) {
      case 'setup': return { ...setup, have: Object.fromEntries(TOOLS.map(t => [t.name, have(t)])) };
      case 'prepare': ensure().catch(() => {}); return { ...setup };
      case 'start': {
        const url = String(c.url || '').trim();
        let u; try { u = new URL(url); } catch { return { error: 'That isn\'t a link' }; }
        if (!/^https?:$/.test(u.protocol)) return { error: 'That isn\'t a web link' };
        await fsp.mkdir(TMP, { recursive: true }); sweep();
        const o = c.opts || {}, id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const j = { id, url, host: u.host.toLowerCase(), status: 'setup', stage: 'setup', pct: 0, error: '', files: [], log: [], site: '', title: '',
          dir: path.join(TMP, id), abort: new AbortController(),
          opts: { mode: ['video', 'audio', 'gif'].includes(o.mode) ? o.mode : 'video', limitMB: Math.max(1, Math.min(2000, +o.limitMB || 10)), maxH: [360, 480, 720, 1080, 1440].includes(+o.maxH) ? +o.maxH : 720,
            maxMin: Math.max(0, Math.min(600, +o.maxMin || 0)), cookies: /^(firefox|chrome|edge|brave|opera|vivaldi|chromium)$/.test(o.cookies || '') ? o.cookies : '' } };
        await fsp.mkdir(j.dir, { recursive: true });
        jobs.set(id, j); work(j);
        return pub(j);
      }
      case 'job': { const j = jobs.get(c.id); if (!j) return { error: 'gone' }; const r = pub(j); if (j.status === 'setup' || setup.state === 'working') { r.setup = { step: setup.step, pct: setup.pct }; } if (setup.state === 'error' && j.status === 'setup') { j.status = 'error'; j.error = 'Setup failed: ' + setup.error; } return r; }
      case 'read': { // a chunk of a finished file, as base64 (Twilight's page <-> main process channel is JSON, so raw bytes would not survive)
        const fh = await fsp.open(inTmp(c.path), 'r');
        try { const len = Math.max(0, Math.min(8 * 1024 * 1024, +c.len || 0)), b = Buffer.alloc(len), { bytesRead } = await fh.read(b, 0, len, +c.at || 0); return { b64: b.subarray(0, bytesRead).toString('base64'), n: bytesRead }; } finally { await fh.close(); }
      }
      case 'clip': return { ok: await clip((c.paths || []).slice(0, 10)) };
      case 'log': { const j = jobs.get(c.id); return { log: j ? j.log.slice(-40) : [] }; }
      case 'cancel': case 'done': {
        const j = jobs.get(c.id); if (!j) return { ok: true };
        if (c.op === 'cancel') j.abort.abort();
        jobs.delete(c.id); setTimeout(() => fsp.rm(j.dir, { recursive: true, force: true }).catch(() => {}), c.op === 'cancel' ? 1500 : 0);
        return { ok: true };
      }
      case 'reset': await fsp.rm(BIN, { recursive: true, force: true }); Object.assign(setup, { state: 'idle', step: '', pct: 0, error: '' }); setupP = null; return { ok: true };
      case 'size': { let n = 0; try { for (const f of await fsp.readdir(BIN)) n += (await fsp.stat(path.join(BIN, f))).size; } catch {} return { bytes: n }; }
    }
    return { error: 'unknown op' };
  } catch (e) { return { error: String(e.message || e).slice(0, 200) }; }
};
