// Puts deleted messages back on screen (red text, tagged "deleted" after the time) and keeps the old text of edited messages above the new one (yellow text, tagged "edited").
// Both are logged in the Log tab, and each logged message is put back in its channel whenever you return to it (any server), until its log entry is removed.
// The log is capped (newest LIMIT entries; exact saved copies for the newest HTML_KEEP, the rest are rebuilt from the log text) so it stays light: the oldest entries and their messages are dropped first.
// reports/messagelogger.json holds counts only (no chat text) to see what the logger did.
Twilight.definePlugin({
  name: 'MessageLogger',
  vs: "Deleted messages vanish and edits overwrite the old text",
  desc: 'Shows deleted messages (red text) and old versions of edited messages (yellow text) in chat, and logs both',
  LIMIT: 200, HTML_KEEP: 50, HTML_MAX: 30000,
  keyOf: e => e.at + ':' + e.id,
  htmlGet() { try { return JSON.parse(localStorage.getItem('twilight-msghtml') || '{}'); } catch { return {}; } },
  htmlSet(o) { try { localStorage.setItem('twilight-msghtml', JSON.stringify(o)); } catch {} },
  // Takes a message's on-screen copy off the page (all copies of that log entry).
  removeGhost(at, id) { for (const g of [...(this.ghosts || [])]) if (g.dataset.twId === String(id) && (at == null || g.dataset.twAt === String(at))) { g.remove(); this.ghosts.delete(g); } },
  // Removes one log entry together with its saved copy and the message it put on screen.
  drop(e) {
    const k = this.keyOf(e), h = this.htmlGet(); if (k in h) { delete h[k]; this.htmlSet(h); }
    Twilight.ls.set('msglog', Twilight.ls.get('msglog', []).filter(x => this.keyOf(x) !== k));
    this.removeGhost(e.at, e.id);
  },
  clearAll() { Twilight.ls.set('msglog', []); this.htmlSet({}); this.clearGhosts?.(); },
  options: [
    { key: 'ghost', label: 'Show deleted messages in chat', def: true },
    { key: 'editGhost', label: 'Keep the old version of edited messages in chat (yellow + "edited" tag)', def: true },
    { key: 'highlight', label: 'Colour deleted and edited messages (red / yellow text + tag by the time). Off = they look like normal messages', def: true },
    { key: 'toast', label: 'Notify on delete', def: true },
    { key: 'ignoreOwn', label: 'Ignore my own messages', def: true },
    { key: 'ignoreBots', label: 'Ignore bots and webhooks (no log entry, no restored message)', def: true },
  ],
  actions: [
    { label: 'Clear message log', sub: 'MessageLogger', run() { Twilight.plugins.get('MessageLogger').clearAll(); Twilight.debug.refresh(); Twilight.notify('MessageLogger', 'Log cleared', 1800, 'info'); } },
    { label: 'Hide restored (deleted and edited) messages in this view', sub: 'MessageLogger', run() { const m = Twilight.plugins.get('MessageLogger'); m.clearGhosts?.(); Twilight.notify('MessageLogger', 'Removed', 1800, 'info'); } },
  ],
  tab: {
    name: 'Log',
    render() {
      const { h } = Twilight, all = Twilight.ls.get('msglog', []);
      // Filter by server: click servers to show only those (none selected = everything).
      const servers = [...new Set(all.map(e => e.guild || 'Unknown'))];
      const picked = Twilight.ls.get('msglogfilter', []).filter(n => servers.includes(n));
      const toggle = n => { Twilight.ls.set('msglogfilter', picked.includes(n) ? picked.filter(x => x !== n) : [...picked, n]); Twilight.debug.refresh(); };
      const log = picked.length ? all.filter(e => picked.includes(e.guild || 'Unknown')) : all;
      const nodes = [h('div', { className: 'twd-row', textContent: 'Clear log', onclick: () => { Twilight.plugins.get('MessageLogger').clearAll(); Twilight.debug.refresh(); } })];
      if (servers.length > 1) nodes.push(h('div', { className: 'twd-chips' },
        h('div', { className: 'twd-chip' + (picked.length ? '' : ' on'), textContent: 'All servers', onclick: () => { Twilight.ls.set('msglogfilter', []); Twilight.debug.refresh(); } }),
        ...servers.map(n => h('div', { className: 'twd-chip' + (picked.includes(n) ? ' on' : ''), textContent: n, onclick: () => toggle(n) }))));
      if (!log.length) nodes.push(h('div', { className: 'twd-out', textContent: all.length ? 'Nothing from the selected servers.' : 'Nothing logged yet. Deleted and edited messages will appear here.' }));
      for (const e of log) {
        const when = new Date(e.at).toLocaleTimeString();
        nodes.push(h('div', { className: 'twd-log ' + e.type },
          h('b', { textContent: `${e.type === 'delete' ? 'DELETED' : 'EDITED'} · ${e.author || 'unknown'} · ${e.guild ? e.guild + ' ' : ''}${e.where || e.channel} · ${when}  ` },
            h('span', { textContent: '✕ remove', style: 'cursor:pointer;color:#ff8a94;margin-left:8px', onclick: () => { Twilight.plugins.get('MessageLogger').drop(e); Twilight.debug.refresh(); } })),
          h('div', { textContent: e.content || '(no text)' }),
          ...(e.type === 'edit' ? [h('div', { className: 'new', textContent: '→ ' + e.now })] : [])));
      }
      return nodes;
    },
  },
  start() {
    this.cache = new Map();
    this.ghosts = new Set();
    this.css = Object.assign(document.createElement('style'), {
      textContent: `.tw-ghost [class*=markup],.tw-ghost [class*=messageContent]{color:#e5444f!important}
.tw-ghost.tw-edited [class*=markup],.tw-ghost.tw-edited [class*=messageContent]{color:#ffd23f!important}
.tw-tag{display:inline-block;margin:2px 0 6px 72px;padding:1px 6px;border-radius:3px;background:#e5444f;color:#fff;
font:700 10px "Segoe UI",sans-serif;letter-spacing:.12em;text-transform:uppercase}
.tw-tag.tw-in{margin:0 0 0 6px;vertical-align:middle;line-height:14px}
.tw-synth{list-style:none;padding:6px 16px 6px 72px}.tw-synth h3{margin:0 0 2px;font:600 15px "gg sans","Segoe UI",sans-serif;color:var(--header-primary,#fff)}
.tw-synth time{font:12px "gg sans","Segoe UI",sans-serif;color:var(--text-muted,#949ba4);margin-left:8px}.tw-synth .markup_tw{white-space:pre-wrap;word-break:break-word;font-size:16px;line-height:1.375}
.tw-ghost.tw-edited .tw-tag{background:#ffd23f;color:#1a1500}
html.tw-nohl .tw-ghost [class*=markup],html.tw-nohl .tw-ghost [class*=messageContent],.tw-ghost.tw-normal [class*=markup],.tw-ghost.tw-normal [class*=messageContent]{color:inherit!important}
html.tw-nohl .tw-tag,.tw-ghost.tw-normal .tw-tag{display:none!important}`,
    });
    document.documentElement.append(this.css);
    this.syncHl = () => document.documentElement.classList.toggle('tw-nohl', !Twilight.opt('MessageLogger', 'highlight', true));
    this.onOpt = e => { if (e.detail?.plugin === 'MessageLogger') this.syncHl(); };
    this.syncHl(); window.addEventListener('tw-opt', this.onOpt); // option changes arrive as an event, no polling

    const opt = (k, d) => Twilight.opt('MessageLogger', k, d);
    const me = () => Twilight.findStore('UserStore')?.getCurrentUser?.()?.id;
    const where = id => { const c = Twilight.findStore('ChannelStore')?.getChannel?.(id); return c?.name ? '#' + c.name : undefined; };
    const remember = (m, ch) => {
      if (!m?.id) return;
      this.cache.set(m.id, { id: m.id, channel: m.channel_id || ch, author: m.author?.username, authorId: m.author?.id, bot: !!(m.author?.bot || m.webhook_id || m.webhookId), content: m.content || '' });
      if (this.cache.size > 3000) this.cache.delete(this.cache.keys().next().value);
    };
    const guildOf = id => {
      const gid = Twilight.findStore('ChannelStore')?.getChannel?.(id)?.guild_id;
      return gid ? Twilight.findStore('GuildStore')?.getGuild?.(gid)?.name || 'Server' : 'DMs';
    };
    const push = (type, old, now, html, at = Date.now()) => {
      if (opt('ignoreOwn', true) && old.authorId && old.authorId === me()) return;
      if (opt('ignoreBots', true) && old.bot) return;
      if (!old.content && type === 'delete') return;
      const entry = { type, id: old.id, at, author: old.author, channel: old.channel, where: where(old.channel), guild: guildOf(old.channel), content: old.content.slice(0, 400), now: now?.slice(0, 400) };
      const all = [entry, ...Twilight.ls.get('msglog', [])], keep = all.slice(0, this.LIMIT);
      for (const x of all.slice(this.LIMIT)) this.removeGhost(x.at, x.id); // over the limit: the oldest entries go, and so do their messages
      Twilight.ls.set('msglog', keep);
      // Saved copies (so the message can be put back when you return to its channel): only for the newest entries and only small ones.
      const saved = this.htmlGet(); diag.events[type === 'delete' ? 'delete' : 'edit']++; if (html) { diag.sizes = [...diag.sizes, html.length].slice(-10); }
      if (html && html.length <= this.HTML_MAX) { saved[this.keyOf(entry)] = html; diag.saved++; } else if (html) diag.tooBig = [...diag.tooBig, html.length].slice(-10);
      const live = new Set(keep.slice(0, this.HTML_KEEP).map(this.keyOf));
      for (const k of Object.keys(saved)) if (!live.has(k)) delete saved[k];
      this.htmlSet(saved); flush();
      if (type === 'delete' && opt('toast', true)) Twilight.notify('Message deleted', `${old.author || 'Someone'}: ${old.content.slice(0, 60)}`, 4000, 'warn');
    };

    // Colours a copy of a message and adds its tag (right after the time in the header; a message that continues a group has no visible time, so it keeps a small tag under the text).
    const decorate = (g, id, kind, at) => {
      g.classList.add('tw-ghost'); g.dataset.twId = id; g.dataset.twKind = kind; g.dataset.twAt = at;
      if (kind === 'edited') g.classList.add('tw-edited');
      const tag = Object.assign(document.createElement('span'), { className: 'tw-tag', textContent: kind }), tm = g.querySelector('h3 time, [class*=header] time');
      if (tm) { tag.classList.add('tw-in'); (tm.closest('[class*=timestamp]') || tm).after(tag); } else { const d = document.createElement('div'); d.append(tag); g.append(d); }
    };
    // Copy the message's element next to the original right now; Discord removes the original a moment later. Returns the plain copy's HTML so it can be saved with the log entry.
    const ghost = (channelId, id, kind = 'deleted', at = Date.now()) => {
      const el = document.getElementById(`chat-messages-${channelId}-${id}`) || document.querySelector(`li[id$="-${id}"]`);
      if (!el?.parentNode) { diag.noElement++; flush(); return Twilight.log(`MessageLogger: ${kind} message is not on screen, only logged`); }
      const g = el.cloneNode(true);
      for (const n of [g, ...g.querySelectorAll('[id],[data-list-item-id]')]) { n.removeAttribute('id'); n.removeAttribute('data-list-item-id'); }
      g.removeAttribute('tabindex');
      g.querySelectorAll('[class*=buttonContainer],[class*=hoverBar]').forEach(n => n.remove());
      const html = g.outerHTML;
      decorate(g, id, kind, at);
      kind === 'edited' ? el.before(g) : el.after(g); // old version sits above the new one; a deleted message stays where it was
      this.ghosts.add(g);
      Twilight.log(`MessageLogger: kept a ${kind} message on screen`);
      return html;
    };
    // Counts only, never message text: written to reports/messagelogger.json so problems can be seen without reading chats.
    const diag = this.diag = { v: '1.11.7', events: { delete: 0, edit: 0 }, noElement: 0, saved: 0, tooBig: [], sizes: [], restore: { runs: 0 } };
    let dT = 0;
    const flush = () => { clearTimeout(dT); dT = setTimeout(() => { try { Twilight.cmd({ type: 'report', name: 'messagelogger.json', text: JSON.stringify({ at: new Date().toISOString(), ...diag, logEntries: Twilight.ls.get('msglog', []).length, savedCopies: Object.keys(this.htmlGet()).length }) }); } catch {} }, 1500); };
    this.flushDiag = flush;
    // A plain message built from the log text, for entries without a saved copy (too big, or logged before copies were kept).
    const synth = e => {
      const li = document.createElement('li'); li.className = 'tw-synth';
      let when; try { when = new Date(Number((BigInt(e.id) >> 22n) + 1420070400000n)); } catch { when = new Date(e.at); }
      const h3 = document.createElement('h3'), au = document.createElement('span'), ts = document.createElement('span'), tm = document.createElement('time');
      au.textContent = e.author || 'unknown'; ts.className = 'timestamp_tw'; tm.textContent = when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      ts.append(tm); h3.append(au, ts);
      const body = document.createElement('div'); body.className = 'markup_tw'; body.textContent = e.content || '(no text)';
      li.append(h3, body); return li;
    };
    // Put logged messages back when you come (back) to their channel: each goes in front of the first loaded message with a newer id.
    const idGt = (a, b) => a.length !== b.length ? a.length > b.length : a > b;
    this.restore = () => {
      const ch = location.pathname.split('/')[3], r = diag.restore; if (!/^\d+$/.test(ch || '')) return;
      const saved = this.htmlGet(), list = Twilight.ls.get('msglog', []).filter(e => e.channel === ch);
      const lis = [...document.querySelectorAll(`li[id^="chat-messages-${ch}-"]`)];
      Object.assign(r, { runs: r.runs + 1, entries: list.length, loaded: lis.length, placed: 0, skippedOlder: 0, skippedEnd: 0, fromCopy: 0, rebuilt: 0 });
      if (!list.length || !lis.length) return list.length && flush();
      const idOf = li => li.id.slice(li.id.lastIndexOf('-') + 1), atEnd = !document.querySelector('[class*=jumpToPresent]');
      list.sort((a, b) => idGt(a.id, b.id) ? 1 : idGt(b.id, a.id) ? -1 : a.at - b.at);
      for (const e of list) {
        if (document.querySelector(`.tw-ghost[data-tw-id="${e.id}"][data-tw-at="${e.at}"]`)) continue; // already on screen
        if (idGt(idOf(lis[0]), e.id)) { r.skippedOlder++; continue; } // older than what is loaded: its place is not on screen yet
        const next = lis.find(li => !idGt(e.id, idOf(li)));
        if (!next && !atEnd) { r.skippedEnd++; continue; } // newer than what is loaded while you are looking at older messages
        let g = null;
        if (saved[this.keyOf(e)]) { const t = document.createElement('template'); t.innerHTML = saved[this.keyOf(e)]; g = t.content.firstElementChild; g && r.fromCopy++; }
        if (!g) { g = synth(e); r.rebuilt++; }
        decorate(g, e.id, e.type === 'delete' ? 'deleted' : 'edited', e.at);
        next ? next.before(g) : lis[lis.length - 1].after(g);
        this.ghosts.add(g); r.placed++;
      }
      flush();
    };
    this.clearGhosts = () => { this.ghosts.forEach(g => g.remove()); this.ghosts.clear(); };

    const handled = new Set(); // Discord can announce one delete more than once
    const del = (id, ch) => {
      if (handled.has(id)) return;
      handled.add(id);
      if (handled.size > 500) handled.delete(handled.values().next().value);
      const old = this.cache.get(id);
      const own = !!old?.authorId && old.authorId === me();
      const at = Date.now();
      const html = opt('ghost', true) && !(own && opt('ignoreOwn', true)) && !(old?.bot && opt('ignoreBots', true)) ? ghost(ch || old?.channel, id, 'deleted', at) : undefined;
      if (old) push('delete', old, undefined, html, at);
    };
    this.on = {
      MESSAGE_CREATE: a => remember(a.message, a.channelId),
      LOAD_MESSAGES_SUCCESS: a => { (a.messages || []).forEach(m => remember(m, a.channelId)); clearTimeout(this.lmT); this.lmT = setTimeout(this.restore, 250); }, // older messages loaded: put back what belongs there
      MESSAGE_UPDATE: a => {
        const m = a.message, old = m && this.cache.get(m.id);
        if (!old || m.content == null || m.content === old.content) return;
        const own = !!old.authorId && old.authorId === me();
        const at = Date.now(), html = opt('editGhost', true) && !(own && opt('ignoreOwn', true)) && !(old.bot && opt('ignoreBots', true)) ? ghost(m.channel_id || old.channel, m.id, 'edited', at) : undefined;
        push('edit', old, m.content, html, at);
        old.content = m.content;
      },
      MESSAGE_DELETE: a => del(a.id, a.channelId),
      MESSAGE_DELETE_BULK: a => (a.ids || []).forEach(id => del(id, a.channelId)),
      CHANNEL_SELECT: () => { this.clearGhosts(); this.rt.forEach(clearTimeout); this.rt = [350, 1200].map(ms => setTimeout(this.restore, ms)); }, // show this channel's logged messages once Discord has drawn it
    };
    this.rt = [1500].map(ms => setTimeout(this.restore, ms));
    this.undo = Twilight.onFlux(this.on, 'MessageLogger');
    Twilight.log('MessageLogger: listening for message events');
  },
  stop() {
    this.undo?.(); (this.rt || []).forEach(clearTimeout); clearTimeout(this.lmT);
    this.clearGhosts?.();
    this.css?.remove(); window.removeEventListener('tw-opt', this.onOpt); document.documentElement.classList.remove('tw-nohl');
  },
});
