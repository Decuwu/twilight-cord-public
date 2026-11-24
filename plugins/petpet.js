// /petpet: makes the classic pet-pet GIF of someone's avatar (squished avatar + a patting hand) and attaches it to your message box.
// Use: type /petpet in the command list (Twilight app), Alt+Shift+click any avatar, or use the Petpet tab. Needs no account keys; it only downloads the avatar from Discord's own CDN.
// The hand frames are the stock pet-pet sprite (112x112, 5 frames, from benisland.neocities.org/petpet). GIF encoder: gifenc by Matt DesLauriers (MIT), minified.
// The GIF encoder and the hand sprite live in assets/petpet.js and load on first use (Twilight.asset), so they cost nothing at start-up.

// 10 frames: the avatar squishes down and back up while the hand follows (sprite frame 0 = raised ... 4 = pressing).
function petFrames(avatar, hand, S, N, mk) {
  const frames = [], k = S / 112;
  for (let i = 0; i < N; i++) {
    const sq = i < N / 2 ? i : N - i, w = 0.8 + sq * 0.02, hh = 0.8 - sq * 0.05, ox = (1 - w) * 0.5 + 0.1, oy = 1 - hh - 0.08;
    const c = mk(S, S), g = c.getContext('2d');
    g.drawImage(avatar, ox * S, oy * S, w * S, hh * S); // the full square picture, not cropped to a circle
    const hs = 0.62; // the hand is drawn smaller than the picture so it does not hide the avatar
    g.drawImage(hand, Math.min(4, sq) * 112, 0, 112, 112, 0, Math.round(sq * 6 * k * hs), S * hs, S * hs);
    frames.push(g.getImageData(0, 0, S, S));
  }
  return frames;
}

Twilight.definePlugin({
  name: 'Petpet',
  vs: 'No way to pet someone',
  desc: '/petpet: a pet-pet GIF of someone’s avatar, ready to send',
  tab: {
    name: 'Petpet',
    render() {
      const T = Twilight, { h } = T, p = T.plugins.get('Petpet');
      const q = h('input', { placeholder: 'Name, @name or user ID (empty = this DM)', value: p.last || '' });
      const prev = h('img', { style: 'display:block;width:128px;height:128px;margin:8px 0;border-radius:6px;background:rgba(255,255,255,.05)' });
      if (p.url) prev.src = p.url;
      const make = async attach => {
        try {
          const u = p.resolve(q.value.trim()); p.last = q.value;
          if (!u) return T.notify('Petpet', 'Could not work out who. Type a name or ID, or open their DM', 4500, 'warn');
          const blob = await p.gif(u); if (p.url) URL.revokeObjectURL(p.url); p.url = URL.createObjectURL(blob); prev.src = p.url;
          attach ? p.attach(blob, u) : p.save(blob, u);
        } catch (e) { T.log('Petpet failed', e); T.notify('Petpet failed', String(e.message || e).slice(0, 70), 5000, 'error'); }
      };
      return [T.ui.sec('Pet someone'), q, prev,
        T.ui.action('Make GIF and get it ready to send', () => make(true), null, 'Attaches it to your message box'),
        T.ui.action('Make GIF and save it', () => make(false), null, 'Saves petpet_<name>.gif to Downloads'),
        T.ui.sec('Other ways'), T.ui.info('Command', '/petpet (needs the Tag commands plugin on)'), T.ui.info('On an avatar', 'Alt+Shift+click')];
    },
  },
  user(id) { return Twilight.findStore('UserStore')?.getUser?.(id); },
  nameOf(u) { return u?.globalName || u?.username || 'user'; },
  // who? text may be empty (current DM), a user ID, a name or an @mention
  resolve(text) {
    const T = Twilight, S = n => T.findStore(n), us = S('UserStore');
    text = (text || '').replace(/[\u200b\ufeff]/g, '').replace(/^\/petpet/i, '').trim().replace(/^<@!?(\d+)>$/, '$1').replace(/^@/, '');
    if (/^\d{15,}$/.test(text)) return us?.getUser?.(text);
    if (text) {
      const all = Object.values(us?.getUsers?.() || {}), t = text.toLowerCase();
      const exact = all.find(u => (u.username || '').toLowerCase() === t || (u.globalName || '').toLowerCase() === t);
      if (exact) return exact;
      try { // a server nickname (what a picked @mention shows in a server)
        const gid = S('SelectedGuildStore')?.getGuildId?.(), m = gid && S('GuildMemberStore')?.getMembers?.(gid)?.find(x => (x.nick || '').toLowerCase() === t);
        if (m) return us?.getUser?.(m.userId);
      } catch {}
      return all.find(u => (u.username || '').toLowerCase().startsWith(t) || (u.globalName || '').toLowerCase().startsWith(t));
    }
    const ch = S('ChannelStore')?.getChannel?.(S('SelectedChannelStore')?.getChannelId?.());
    const id = ch?.type === 1 ? ch.recipients?.[0] : null;
    return id ? us?.getUser?.(id) : null;
  },
  avatar(u) {
    if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`;
    return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`;
  },
  async assets() { return this._a ||= Twilight.asset('petpet').catch(e => { this._a = null; throw e; }); },
  async hand() {
    if (this._hand) return this._hand;
    const im = new Image(); im.src = (await this.assets()).HAND; await im.decode(); return this._hand = im;
  },
  async encode(avatar, S = 112, N = 10) {
    const frames = petFrames(avatar, await this.hand(), S, N, (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h }));
    const { GE } = await this.assets(), enc = GE.GIFEncoder();
    for (const f of frames) {
      const d = f.data, pal = GE.quantize(d, 256, { format: 'rgba4444', oneBitAlpha: true }), idx = GE.applyPalette(d, pal, 'rgba4444'), ti = pal.findIndex(c => c[3] === 0);
      enc.writeFrame(idx, S, S, { palette: pal, delay: 30, transparent: ti >= 0, transparentIndex: ti < 0 ? 0 : ti, dispose: 2 });
      await new Promise(r => setTimeout(r)); // let Discord breathe between frames
    }
    enc.finish();
    return new Blob([enc.bytes()], { type: 'image/gif' });
  },
  async gif(u) { return this.encode(await createImageBitmap(await (await fetch(this.avatar(u))).blob())); },
  // Used by the Probe self-test: runs the whole GIF pipeline on a tiny generated picture (no network, nothing is sent).
  async selfTest() {
    const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
    const av = cv(64, 64), g = av.getContext('2d'); g.fillStyle = '#4a90d9'; g.fillRect(0, 0, 64, 64);
    const b = await this.encode(av, 112, 4), head = new Uint8Array(await b.arrayBuffer()).slice(0, 6);
    return { bytes: b.size, header: String.fromCharCode(...head) };
  },
  save(blob, u) {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `petpet_${this.nameOf(u).replace(/[^\w-]/g, '_')}.gif` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    Twilight.notify('Petpet', 'Saved to Downloads', 2500, 'success');
  },
  // Hands the GIF to Discord as if you had pasted it into the message box.
  attach(blob, u) {
    const file = new File([blob], `petpet_${this.nameOf(u).replace(/[^\w-]/g, '_')}.gif`, { type: 'image/gif' });
    const box = document.querySelector('[role="textbox"][contenteditable="true"]');
    if (!box) { Twilight.notify('Petpet', 'Open a chat first. Saved instead', 4000, 'warn'); return this.save(blob, u); }
    const dt = new DataTransfer(); dt.items.add(file); box.focus();
    box.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    this.armed = Date.now(); [0, 150, 500].forEach(ms => setTimeout(() => this.clearLeft(), ms)); // the typed "/petpet" must not go out with the GIF
    Twilight.notify('Petpet', `${this.nameOf(u)}’s pet-pet GIF is ready. Press Enter to send`, 4500, 'success');
  },
  boxEl() { return document.querySelector('[role="textbox"][contenteditable="true"]'); },
  // true when the box holds only the leftover command text ("/petpet" or "/petpet name")
  isLeft(box) { return !!box && /^[\s\u200b\ufeff]*\/petpet\b[^\n]*$/i.test(box.textContent || ''); },
  clearLeft() {
    const box = this.boxEl(); if (!this.isLeft(box)) return;
    try { box.focus(); document.execCommand('selectAll'); document.execCommand('delete'); } catch {}
  },
  async run(text) {
    if (Date.now() - (this.ranAt || 0) < 1500) return; this.ranAt = Date.now();
    const u = this.resolve(text);
    if (!u) return Twilight.notify('Petpet', 'Who? Use /petpet name, or open a DM first', 4500, 'warn');
    Twilight.notify('Petpet', `Making ${this.nameOf(u)}’s GIF...`, 1800, 'info');
    try { this.attach(await this.gif(u), u); } catch (e) { Twilight.log('Petpet failed', e); Twilight.notify('Petpet failed', String(e.message || e).slice(0, 70), 5000, 'error'); }
  },
  start() {
    const me = this;
    // Shows up in Discord's slash-command list (Twilight app) through the Tag commands plugin.
    Twilight.slash.add({ name: 'petpet', id: '9000000000000000015', desc: 'Make a pet-pet GIF of someone’s avatar', opts: [{ name: 'user', type: 6, description: 'Who to pet (pick a user; empty = the person in this DM)', required: false }], run: v => me.run(v.user) });
    this.click = e => {
      if (!e.altKey || !e.shiftKey) return;
      const m = (e.target.closest?.('img')?.src || '').match(/\/avatars\/(\d+)\//);
      if (!m) return;
      e.preventDefault(); e.stopPropagation(); this.run(m[1]);
    };
    window.addEventListener('click', this.click, true);
    // Safety: if the typed "/petpet" is still in the box next to the GIF, Enter clears it instead of sending it as text.
    this.key = e => {
      if (e.key !== 'Enter' || e.shiftKey || Date.now() - (this.armed || 0) > 300000) return;
      const box = e.target?.closest?.('[role="textbox"][contenteditable="true"]'); if (!this.isLeft(box)) return;
      e.preventDefault(); e.stopImmediatePropagation(); this.clearLeft();
      Twilight.notify('Petpet', 'Removed the /petpet text. Press Enter again to send just the GIF', 3500, 'info');
    };
    window.addEventListener('keydown', this.key, true);
  },
  stop() { Twilight.slash.remove('petpet'); window.removeEventListener('click', this.click, true); window.removeEventListener('keydown', this.key, true); },
});
