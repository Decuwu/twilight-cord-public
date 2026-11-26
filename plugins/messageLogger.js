// Puts deleted messages back on screen (red text, tagged "deleted" after the time) and keeps the old text of edited messages above the new one (yellow text, tagged "edited").
// Both are logged in the Log tab, and each logged message is put back in its channel whenever you return to it (any server), until its log entry is removed.
// The log is capped (newest LIMIT entries; exact saved copies for the newest HTML_KEEP, the rest are rebuilt from the log text) so it stays light: the oldest entries and their messages are dropped first.
// reports/messagelogger.json holds counts only (no chat text) to see what the logger did.
Twilight.definePlugin({
  name: 'MessageLogger',
  vs: "Deleted messages vanish and edits overwrite the old text",
  desc: 'Shows deleted messages (red text) and old versions of edited messages (yellow text) in chat, and logs both',
  LIMIT: 200, HTML_KEEP: 50, HTML_MAX: 30000, HTML_TOTAL: 512 * 1024, // 1.24.0: saved copies never add up to more than 0.5 MB
  keyOf: e => e.at + ':' + e.id,
  // Saved copies live in Twilight.ls.local (Discord deletes window.localStorage after start-up, so a plain localStorage call here
  // silently saved nothing before 1.15.5). Not in settings.json: up to HTML_KEEP x HTML_MAX of HTML would make every settings save heavy.
  htmlGet() { if (this._html) return this._html; const o = Twilight.ls.local.get('msghtml', null); return this._html = o && typeof o === 'object' ? o : {}; },
  // The object is changed in place and served from memory (ls.local); writing it out (up to HTML_KEEP x HTML_MAX of text) waits 1 s, so a burst is one write.
  htmlSet(o) { this._html = o; clearTimeout(this._hT); this._hT = setTimeout(() => { Twilight.ls.local.set('msghtml', this._html); }, 1000); },
  // Takes a message's on-screen copy off the page (all copies of that log entry).
  removeGhost(at, id) { for (const g of [...(this.ghosts || [])]) if (g.dataset.twId === String(id) && (at == null || g.dataset.twAt === String(at))) { g.remove(); this.ghosts.delete(g); } },
  // Removes one log entry together with its saved copy and the message it put on screen.
  drop(e) {
    const k = this.keyOf(e), h = this.htmlGet(); if (k in h) { delete h[k]; this.htmlSet(h); }
    Twilight.ls.set('msglog', Twilight.ls.get('msglog', []).filter(x => this.keyOf(x) !== k));
    this.removeGhost(e.at, e.id);
  },
  // Open the channel at the logged message (Discord loads the chat around that point in time, so deleted ones land in the right spot too).
  jump(e) {
    const T = Twilight, ch = T.findStore('ChannelStore')?.getChannel?.(e.channel);
    if (!ch && !e.gid && e.guild !== 'DMs') return T.notify('MessageLogger', 'Can not open that channel any more (left the server or no access)', 3500, 'warn');
    const path = `/channels/${e.gid || ch?.guild_id || '@me'}/${e.channel}/${e.id}`;
    T.go(path);
  },
  // Every version of one message, oldest first: the text before the first logged edit, each edit, and the delete if it was deleted.
  history(id) {
    const es = (Twilight.ls.get('msglog', []) || []).filter(e => e.id === id).sort((a, b) => a.at - b.at), out = [];
    const edits = es.filter(e => e.type === 'edit');
    if (edits.length) { out.push({ kind: 'original', text: edits[0].content, at: null }); for (const e of edits) out.push({ kind: 'edit', text: e.now, at: e.at }); }
    const del = es.find(e => e.type === 'delete'); if (del) { if (!out.length) out.push({ kind: 'original', text: del.content, at: null }); out.push({ kind: 'deleted', text: null, at: del.at }); }
    return { versions: out, author: es[0]?.author, where: es[0]?.where || es[0]?.channel, guild: es[0]?.guild, entry: es[0] };
  },
  // A small floating panel with the history (Escape, the X or a click outside closes it).
  showHistory(id) {
    const T = Twilight, H = this.history(id); if (!H.versions.length) return T.notify('Edit history', 'Nothing logged for this message', 2500, 'info');
    document.querySelector('.tw-hist')?.remove();
    const box = document.createElement('div'); box.className = 'tw-hist'; box.setAttribute('role', 'dialog');
    const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
    const hd = el('div', 'tw-hist-hd'), close = el('div', 'tw-hist-x', '✕'); hd.append(el('b', null, 'Edit history'), el('span', null, ` ${H.author || 'Someone'} · ${H.guild ? H.guild + ' · ' : ''}${H.where || ''}`), close);
    const list = el('div', 'tw-hist-list');
    H.versions.forEach((v, i) => {
      const row = el('div', 'tw-hist-v ' + v.kind), meta = el('div', 'tw-hist-meta', (v.kind === 'original' ? 'Original' : v.kind === 'deleted' ? 'Deleted' : 'Edit ' + i) + (v.at ? ' · ' + new Date(v.at).toLocaleString() : ''));
      if (v.text != null) { const c = el('span', 'tw-hist-copy', 'copy'); c.onclick = () => navigator.clipboard.writeText(v.text).then(() => T.notify('Copied', 'That version', 1500, 'success')); meta.append(c); }
      row.append(meta); if (v.text != null) row.append(el('div', 'tw-hist-t', v.text || '(no text)')); list.append(row);
    });
    const foot = el('div', 'tw-hist-foot'), jump = el('span', 'tw-hist-copy', '↗ jump to it'); jump.onclick = () => { this.jump(H.entry); off(); }; foot.append(jump);
    box.append(hd, list, foot); document.body.append(box);
    const off = () => { box.remove(); document.removeEventListener('keydown', key, true); document.removeEventListener('mousedown', out, true); };
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); off(); } }, out = e => { if (!box.contains(e.target)) off(); };
    close.onclick = off; document.addEventListener('keydown', key, true); setTimeout(() => document.addEventListener('mousedown', out, true), 0);
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
  tab: {
    name: 'Log',
    render() {
      const T = Twilight, { h } = T, all = T.ls.get('msglog', []), me = T.plugins.get('MessageLogger');
      // Filter by server: click servers to show only those (none selected = everything).
      const servers = [...new Set(all.map(e => e.guild || 'Unknown'))];
      const picked = T.ls.get('msglogfilter', []).filter(n => servers.includes(n));
      const toggle = n => { T.ls.set('msglogfilter', picked.includes(n) ? picked.filter(x => x !== n) : [...picked, n]); T.debug.refresh(); };
      const kind = T.ls.get('msglogkind', 'all'); // all | delete | edit
      const log = all.filter(e => (!picked.length || picked.includes(e.guild || 'Unknown')) && (kind === 'all' || e.type === kind));
      // Search filters the rows already on the page (no redraw, so the box keeps your cursor). Matches name, server, channel and text.
      const rows = [], count = h('small', { className: 'twd-out' });
      const search = T.ui.input('Search the log: name, server, channel or text', '');
      const filter = () => { const q = search.value.trim().toLowerCase(); let n = 0; for (const [r, text] of rows) { const on = !q || text.includes(q); r.style.display = on ? '' : 'none'; n += on; } count.textContent = q ? `${n} of ${rows.length} match` : `${rows.length} logged${log.length < all.length ? ` (of ${all.length})` : ''}`; };
      search.oninput = filter;
      const nodes = [h('style', { textContent: '.twd-log.tw-jump{cursor:pointer;border-radius:4px}.twd-log.tw-jump:hover{background:var(--tw-hover,rgba(255,255,255,.05))}' }), T.ui.sec('Log'), search,
        h('div', { className: 'twd-chips' }, ...[['all', 'All'], ['delete', 'Deleted'], ['edit', 'Edited']].map(([k, l]) => h('div', { className: 'twd-chip' + (kind === k ? ' on' : ''), textContent: l, onclick: () => { T.ls.set('msglogkind', k); T.debug.refresh(); } }))),
      ];
      if (servers.length > 1) nodes.push(h('div', { className: 'twd-chips' },
        h('div', { className: 'twd-chip' + (picked.length ? '' : ' on'), textContent: 'All servers', onclick: () => { T.ls.set('msglogfilter', []); T.debug.refresh(); } }),
        ...servers.map(n => h('div', { className: 'twd-chip' + (picked.includes(n) ? ' on' : ''), textContent: n, onclick: () => toggle(n) }))));
      nodes.push(count);
      if (!log.length) nodes.push(h('div', { className: 'twd-out', textContent: all.length ? 'Nothing matches the filters above.' : 'Nothing logged yet. Deleted and edited messages will appear here.' }));
      for (const e of log) {
        const when = new Date(e.at).toLocaleTimeString();
        const r = h('div', { className: 'twd-log tw-jump ' + e.type, title: 'Click to jump to this message', onclick: () => me.jump(e) },
          h('b', { textContent: `${e.type === 'delete' ? 'DELETED' : 'EDITED'} · ${e.author || 'unknown'} · ${e.guild ? e.guild + ' ' : ''}${e.where || e.channel} · ${when}  ` },
            h('span', { textContent: '↗ jump', style: 'color:var(--tw-link,#00a8fc);margin-left:8px' }),
            ...(e.type === 'edit' ? [h('span', { textContent: '≡ history', style: 'cursor:pointer;color:var(--tw-link,#00a8fc);margin-left:8px', onclick: ev => { ev.stopPropagation(); me.showHistory(e.id); } })] : []),
            h('span', { textContent: '✕ remove', style: 'cursor:pointer;color:#ff8a94;margin-left:8px', onclick: ev => { ev.stopPropagation(); me.drop(e); T.debug.refresh(); } })),
          h('div', { textContent: e.content || '(no text)' }),
          ...(e.type === 'edit' ? [h('div', { className: 'new', textContent: '→ ' + e.now })] : []));
        rows.push([r, [e.author, e.guild, e.where, e.content, e.now].filter(Boolean).join(' ').toLowerCase()]); nodes.push(r);
      }
      filter();
      nodes.push(T.ui.sec('Clean up'),
        T.ui.action('Hide restored messages in this view', () => { me.clearGhosts?.(); T.notify('MessageLogger', 'Removed from this view', 1800, 'info'); }, null, 'The red / yellow copies in the chat you have open; the log keeps them'),
        T.ui.action('Clear the whole log', () => { me.clearAll(); T.debug.refresh(); T.notify('MessageLogger', 'Log cleared', 1800, 'info'); }, null, `Deletes all ${all.length} entries`));
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
html.tw-nohl .tw-tag,.tw-ghost.tw-normal .tw-tag{display:none!important}
.tw-ghost.tw-edited .tw-tag{cursor:pointer}
.tw-hist{position:fixed;z-index:10000;right:24px;top:72px;width:min(440px,calc(100vw - 48px));max-height:70vh;display:flex;flex-direction:column;background:var(--background-floating,var(--background-primary,#2b2d31));color:var(--text-normal,#dbdee1);border:1px solid var(--border-subtle,rgba(255,255,255,.08));border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.4);font:14px var(--font-primary,"gg sans",sans-serif)}
.tw-hist-hd{display:flex;align-items:baseline;gap:6px;padding:10px 12px;border-bottom:1px solid var(--border-subtle,rgba(255,255,255,.06))}
.tw-hist-hd span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-muted,#949ba4);font-size:12px}
.tw-hist-x{cursor:pointer;color:var(--text-muted,#949ba4);padding:0 2px}.tw-hist-x:hover{color:var(--text-normal,#fff)}
.tw-hist-list{overflow:auto;padding:6px 12px}
.tw-hist-v{padding:7px 0;border-bottom:1px solid var(--border-subtle,rgba(255,255,255,.05))}.tw-hist-v:last-child{border-bottom:0}
.tw-hist-meta{font-size:11px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:var(--text-muted,#949ba4);display:flex;gap:8px}
.tw-hist-v.edit .tw-hist-meta{color:#d9b232}.tw-hist-v.deleted .tw-hist-meta{color:#e5444f}
.tw-hist-t{white-space:pre-wrap;word-break:break-word;margin-top:3px}
.tw-hist-copy{cursor:pointer;color:var(--text-link,#00a8fc);text-transform:none;font-weight:600;margin-left:auto}.tw-hist-copy:hover{text-decoration:underline}
.tw-hist-foot{padding:6px 12px 10px;display:flex}`,
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
      const entry = { type, id: old.id, at, author: old.author, channel: old.channel, gid: Twilight.findStore('ChannelStore')?.getChannel?.(old.channel)?.guild_id || null, where: where(old.channel), guild: guildOf(old.channel), content: old.content.slice(0, 400), now: now?.slice(0, 400) };
      const all = [entry, ...Twilight.ls.get('msglog', [])], keep = all.slice(0, this.LIMIT);
      for (const x of all.slice(this.LIMIT)) this.removeGhost(x.at, x.id); // over the limit: the oldest entries go, and so do their messages
      Twilight.ls.set('msglog', keep);
      // Saved copies (so the message can be put back when you return to its channel): only for the newest entries and only small ones.
      const saved = this.htmlGet(); diag.events[type === 'delete' ? 'delete' : 'edit']++; if (html) { diag.sizes = [...diag.sizes, html.length].slice(-10); }
      if (html && html.length <= this.HTML_MAX) { saved[this.keyOf(entry)] = html; diag.saved++; } else if (html) diag.tooBig = [...diag.tooBig, html.length].slice(-10);
      const live = new Set(keep.slice(0, this.HTML_KEEP).map(this.keyOf));
      for (const k of Object.keys(saved)) if (!live.has(k)) delete saved[k];
      let total = 0; for (const k of keep.map(this.keyOf)) if (saved[k]) { total += saved[k].length; if (total > this.HTML_TOTAL) delete saved[k]; } // newest kept first
      this.htmlSet(saved); flush();
      if (type === 'delete' && opt('toast', true)) Twilight.notify('Message deleted', `${old.author || 'Someone'}: ${old.content.slice(0, 60)}`, 4000, 'warn');
    };

    // Colours a copy of a message and adds its tag (right after the time in the header; a message that continues a group has no visible time, so it keeps a small tag under the text).
    const decorate = (g, id, kind, at) => {
      g.classList.add('tw-ghost'); g.dataset.twId = id; g.dataset.twKind = kind; g.dataset.twAt = at;
      if (kind === 'edited') g.classList.add('tw-edited');
      const tag = Object.assign(document.createElement('span'), { className: 'tw-tag', textContent: kind }), tm = g.querySelector('h3 time, [class*=header] time');
      if (kind === 'edited') { tag.title = 'Edit history'; tag.onclick = e => { e.stopPropagation(); this.showHistory(id); }; }
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
    const diag = this.diag = { v: '1.23.0', events: { delete: 0, edit: 0 }, noElement: 0, saved: 0, tooBig: [], sizes: [], restore: { runs: 0 } };
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
    this.offCtx = Twilight.ctx.add('MessageLogger', t => {
      const g = t.closest?.('.tw-ghost'), li = !g && t.closest?.('li[id^="chat-messages-"]'), id = g?.dataset.twId || (li && /-(\d+)$/.exec(li.id)?.[1]);
      if (!id) return null;
      const n = this.history(id).versions.filter(v => v.kind !== 'deleted').length;
      return n > 1 ? [{ label: `Edit History (${n} versions)`, icon: 'history', run: () => this.showHistory(id) }] : null;
    });
    Twilight.log('MessageLogger: listening for message events');
  },
  stop() {
    if (this._hT) { clearTimeout(this._hT); Twilight.ls.local.set('msghtml', this._html); } // write out what is waiting
    this.undo?.(); this.offCtx?.(); (this.rt || []).forEach(clearTimeout); clearTimeout(this.lmT);
    this.clearGhosts?.(); document.querySelector('.tw-hist')?.remove();
    this.css?.remove(); window.removeEventListener('tw-opt', this.onOpt); document.documentElement.classList.remove('tw-nohl');
  },
});
