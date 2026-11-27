// /download: give it a TikTok, Instagram, Reddit, YouTube, X/Twitter (or almost any other) link and the video lands in your
// message box as a real attachment, ready to send, and on your clipboard as a file (paste it anywhere with Ctrl+V).
// Everything happens on this PC with yt-dlp, ffmpeg and deno, fetched the first time you use it (about 470 MB on disk, kept in
// %APPDATA%\twilight-cord\bin and kept up to date). Videos are made into H.264 MP4 so they play everywhere, and shrunk to fit your upload limit.
// The engine (downloader.js) only loads in the main process when you first use it, so this costs nothing until then.
Twilight.definePlugin({
  name: 'Download',
  added: '1.26.0',
  place: 'Tools',
  desc: '/download <link>: the video from TikTok, Instagram, Reddit, YouTube, X and more, attached and on your clipboard',
  vs: 'Sharing a TikTok or Reel means a link people have to open',
  options: [
    { key: 'quality', label: 'Best quality to fetch', def: '720', choices: [['480', '480p'], ['720', '720p'], ['1080', '1080p'], ['1440', '1440p']] },
    { key: 'limit', label: 'Upload limit', def: 'auto', choices: [['auto', 'Work it out (Nitro and server boosts)'], ['10', '10 MB'], ['50', '50 MB'], ['100', '100 MB'], ['500', '500 MB']] },
    { key: 'maxMin', label: 'Skip videos longer than', def: '20', choices: [['5', '5 minutes'], ['20', '20 minutes'], ['60', '1 hour'], ['0', 'No limit']] },
    { key: 'clip', label: 'Also copy the file to the clipboard', def: true },
    { key: 'cookies', label: 'Signed-in posts: use the sign-in from', def: 'none', choices: [['none', 'Nothing (public posts only)'], ['firefox', 'Firefox'], ['edge', 'Edge'], ['chrome', 'Chrome'], ['brave', 'Brave'], ['opera', 'Opera']] },
  ],
  tab: {
    name: 'Download',
    render() {
      const T = Twilight, { h } = T, p = T.plugins.get('Download');
      const q = h('input', { placeholder: 'Paste a TikTok, Instagram, Reddit, YouTube or X link', value: p.lastUrl || '' });
      const tools = h('div', { style: 'opacity:.75;font-size:12px;margin:4px 0' }, 'Checking tools...');
      T.cmd({ type: 'dl', op: 'setup' }, 4000).then(s => {
        const all = s && Object.values(s.have || {}).every(Boolean);
        tools.textContent = s?.state === 'working' ? `Getting tools: ${s.step} (${s.pct}%)` : all ? 'Tools ready (yt-dlp, ffmpeg, deno)' : 'Tools not downloaded yet: they come down the first time you use /download (about 470 MB on disk)';
      }).catch(() => { tools.textContent = 'Could not reach the download engine'; });
      return [T.ui.sec('Download a video'), q,
        T.ui.action('Download and attach', () => { p.lastUrl = q.value.trim(); p.run(p.lastUrl, 'video'); }, null, 'Into your message box, ready to send'),
        T.ui.action('Audio only (MP3)', () => { p.lastUrl = q.value.trim(); p.run(p.lastUrl, 'audio'); }),
        T.ui.action('As a GIF', () => { p.lastUrl = q.value.trim(); p.run(p.lastUrl, 'gif'); }, null, 'First 30 seconds, no sound'),
        T.ui.sec('Tools'), tools,
        T.ui.action('Get the tools now', () => T.cmd({ type: 'dl', op: 'prepare' }, 4000).then(() => T.notify('Download', 'Getting the tools in the background', 3000, 'info'))),
        T.ui.action('Re-download the tools', () => T.cmd({ type: 'dl', op: 'reset' }, 8000).then(() => T.notify('Download', 'Removed. They come back on next use', 3000, 'info')), null, 'If a site keeps failing'),
        T.ui.sec('How'), T.ui.info('Command', '/download link (format: Video, Audio or GIF)'), T.ui.info('Cancel', 'Click the progress pill'), T.ui.info('Log', 'reports\\download.txt')];
    },
  },

  // ---- upload limit: your Nitro, or the server's boost level, whichever is bigger
  limitMB() {
    const T = Twilight, v = T.opt('Download', 'limit', 'auto');
    if (v !== 'auto') return +v || 10;
    let mb = 10;
    try { const pt = T.findStore('UserStore')?.getCurrentUser?.()?.premiumType; mb = pt === 2 ? 500 : pt === 1 || pt === 3 ? 50 : 10; } catch {}
    try {
      const gid = T.findStore('SelectedGuildStore')?.getGuildId?.(), tier = gid && T.findStore('GuildStore')?.getGuild?.(gid)?.premiumTier;
      mb = Math.max(mb, tier === 3 ? 100 : tier === 2 ? 50 : 10);
    } catch {}
    return mb;
  },
  pickUrl(text) { const m = String(text || '').match(/https?:\/\/[^\s<>]+/i); return m ? m[0].replace(/[).,!?;:'"]+$/, '') : ''; },

  // ---- the progress pill (bottom middle, above the message box). Click it to cancel.
  pill(text, pct, kind = 'busy') {
    let el = document.getElementById('tw-dl-pill');
    if (!el) {
      el = Object.assign(document.createElement('div'), { id: 'tw-dl-pill' });
      el.innerHTML = '<div class="b"></div><span></span>';
      el.style.cssText = 'position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:10000;min-width:220px;max-width:460px;padding:7px 14px;border-radius:999px;background:var(--background-floating,#111214);color:var(--text-normal,#dbdee1);font:500 13px var(--font-primary,"gg sans",sans-serif);box-shadow:0 4px 16px rgba(0,0,0,.35);overflow:hidden;cursor:pointer;text-align:center;white-space:nowrap;text-overflow:ellipsis;transition:opacity .25s';
      el.firstChild.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:0;background:var(--brand-500,#5865f2);opacity:.28;transition:width .3s linear';
      el.lastChild.style.cssText = 'position:relative';
      el.onclick = () => { if (this.job) this.cancel(); else el.remove(); };
      document.documentElement.append(el);
    }
    clearTimeout(this.pillT); el.style.opacity = '1';
    el.firstChild.style.width = (pct ?? 0) + '%';
    el.firstChild.style.background = kind === 'error' ? 'var(--status-danger,#f23f43)' : kind === 'done' ? 'var(--status-positive,#23a55a)' : 'var(--brand-500,#5865f2)';
    el.lastChild.textContent = text; el.title = kind === 'busy' ? 'Click to cancel' : '';
    if (kind !== 'busy') this.pillT = setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, kind === 'error' ? 6000 : 2200);
  },
  async cancel() {
    const id = this.job; this.job = null; this.cancelled = true;
    if (id) await Twilight.cmd({ type: 'dl', op: 'cancel', id }, 4000).catch(() => {});
    this.pill('Cancelled', 0, 'done');
  },

  async run(text, mode = 'video') {
    const T = Twilight, url = this.pickUrl(text);
    if (!url) return T.notify('Download', 'Give it a link: /download https://...', 4000, 'warn');
    if (this.job) return T.notify('Download', 'Still working on the last one (click the pill to cancel it)', 3500, 'warn');
    const channelId = T.findStore('SelectedChannelStore')?.getChannelId?.();
    this.cancelled = false;
    const limitMB = this.limitMB();
    this.pill('Starting...', 0);
    let j = await T.cmd({ type: 'dl', op: 'start', url, opts: { mode, limitMB, maxH: +T.opt('Download', 'quality', '720'), maxMin: +T.opt('Download', 'maxMin', '20'), cookies: T.opt('Download', 'cookies', 'none') } }, 15000).catch(e => ({ error: String(e.message || e) }));
    if (!j || j.error) { this.pill('Download failed: ' + (j?.error || 'no answer'), 100, 'error'); return; }
    this.job = j.id;
    try {
      const words = { setup: 'First use: getting the download tools', downloading: 'Downloading', processing: 'Getting it ready', compressing: 'Shrinking it to fit ' + limitMB + ' MB' };
      while (j.status !== 'ready' && j.status !== 'error') {
        await new Promise(r => setTimeout(r, 400));
        if (this.cancelled) return;
        j = await T.cmd({ type: 'dl', op: 'job', id: this.job }, 6000).catch(() => j);
        if (j.error && j.status !== 'error') throw new Error(j.error);
        const who = j.site ? j.site + ': ' : '';
        if (j.setup && j.status === 'setup') this.pill(`${words.setup}... ${j.setup.step} ${j.setup.pct}%`, j.setup.pct);
        else this.pill(`${who}${words[String(j.stage).startsWith('compress') ? 'compressing' : j.status] || j.status}... ${j.pct}%`, j.pct);
      }
      if (j.status === 'error') { T.log('Download failed', j.error, (await T.cmd({ type: 'dl', op: 'log', id: j.id }, 4000).catch(() => ({})))?.log); throw new Error(j.error); }

      this.pill('Adding to your message...', 100);
      const files = [];
      for (const f of j.files.slice(0, 10)) {
        const parts = [], CH = 4 * 1024 * 1024;
        for (let at = 0; at < f.size; at += CH) {
          if (this.cancelled) return;
          const r = await T.cmd({ type: 'dl', op: 'read', path: f.path, at, len: Math.min(CH, f.size - at) }, 20000);
          if (typeof r?.b64 !== 'string') throw new Error(r?.error || 'could not read the file');
          const bin = atob(r.b64), u = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          parts.push(u);
        }
        const file = new File(parts, f.name, { type: f.mime });
        if (file.size !== f.size) throw new Error(`${f.name} came through damaged (${file.size} of ${f.size} bytes)`);
        files.push(file);
      }
      let clipped = false;
      if (T.opt('Download', 'clip', true)) clipped = !!(await T.cmd({ type: 'dl', op: 'clip', paths: j.files.slice(0, 10).map(f => f.path) }, 25000).catch(() => null))?.ok;
      const here = T.findStore('SelectedChannelStore')?.getChannelId?.();
      if (here !== channelId) T.notify('Download', 'You switched chats, so it went into this one', 3500, 'info');
      if (!this.attach(files)) { this.pill(clipped ? 'Open a chat to attach it. It is on your clipboard' : 'Open a chat first', 100, 'error'); return; }
      const mb = files.reduce((n, f) => n + f.size, 0) / 1e6, note = j.files.map(f => f.note).filter(Boolean)[0];
      this.pill(`${files.length > 1 ? files.length + ' files' : (j.site || 'Video')} ready · ${mb.toFixed(1)} MB${note ? ' · ' + note : ''}${clipped ? ' · on clipboard' : ''}. Press Enter to send`, 100, 'done');
      this.last = { url, files: j.files.map(f => ({ name: f.name, size: f.size, mime: f.mime, note: f.note })), at: Date.now() };
    } catch (e) {
      if (!this.cancelled) this.pill(String(e.message || e).slice(0, 160), 100, 'error');
    } finally {
      const id = j?.id; if (this.job === id) this.job = null;
      if (id && !this.cancelled) T.cmd({ type: 'dl', op: 'done', id }, 4000).catch(() => {});
    }
  },

  boxEl() { return document.querySelector('[role="textbox"][contenteditable="true"]'); },
  // Hands the files to Discord as if you had pasted them into the message box (same as Petpet).
  attach(files) {
    const box = this.boxEl(); if (!box) return false;
    const dt = new DataTransfer(); for (const f of files) dt.items.add(f); box.focus();
    box.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    this.armed = Date.now(); [0, 150, 500].forEach(ms => setTimeout(() => this.clearLeft(), ms));
    return true;
  },
  isLeft(box) { return !!box && /^[\s​﻿]*\/download\b[^\n]*$/i.test(box.textContent || ''); },
  clearLeft() { const box = this.boxEl(); if (!this.isLeft(box)) return; try { box.focus(); document.execCommand('selectAll'); document.execCommand('delete'); } catch {} },

  start() {
    const me = this;
    Twilight.slash.add({ name: 'download', id: '9000000000000000021', desc: 'Attach the video from a TikTok, Instagram, Reddit, YouTube or X link',
      opts: [{ name: 'link', type: 3, description: 'The link to the post or video', required: true, max_length: 2000 },
        { name: 'format', type: 3, description: 'Video (default), audio only, or a GIF', required: false, choices: [{ name: 'Video', value: 'video' }, { name: 'Audio (MP3)', value: 'audio' }, { name: 'GIF', value: 'gif' }] }],
      run: v => me.run(v.link, v.format || 'video') });
    // Safety: if the typed "/download ..." is still in the box next to the file, Enter clears it instead of sending it as text.
    this.key = e => {
      if (e.key !== 'Enter' || e.shiftKey || Date.now() - (this.armed || 0) > 300000) return;
      const box = e.target?.closest?.('[role="textbox"][contenteditable="true"]'); if (!this.isLeft(box)) return;
      e.preventDefault(); e.stopImmediatePropagation(); this.clearLeft();
    };
    window.addEventListener('keydown', this.key, true);
  },
  stop() { Twilight.slash.remove('download'); window.removeEventListener('keydown', this.key, true); if (this.job) this.cancel(); },
});
