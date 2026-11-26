// Notes: save any message to your own notebook and find it again later. Notes has its own page in the menu (Local > Notes), with little page tabs
// under the header: keep as many note pages as you like (+ adds one, double-click a tab to rename it). Right-click a message >
// Save to Notes (one entry per page when you have several). A copy of the text is kept, so a note still reads fine if the message is
// deleted. Search the page, copy a note, jump back to the message, or remove it. Nothing runs in the background.
Twilight.definePlugin({
  name: 'Notes',
  added: '1.25.0',
  place: 'Notes', // its own page in the sidebar, under Local right below Self
  desc: 'Save messages to your own note pages (right-click > Save to Notes)',
  vs: 'No way to keep messages for later except pins, which everyone in the channel sees',
  MAX: 1000,
  pages() { const p = Twilight.ls.get('notePages', null); return Array.isArray(p) && p.length ? p : [{ id: 'main', name: 'Notes' }]; },
  cur() { const ps = this.pages(), id = Twilight.ls.get('notePage', ps[0].id); return ps.find(p => p.id === id) || ps[0]; },
  list() { return Twilight.ls.get('notes', []); },
  pageOf(n) { return n.page || 'main'; },
  has(id) { return this.list().some(n => n.id === id); },
  save(msg, pageId) {
    const T = Twilight, ch = T.findStore('ChannelStore')?.getChannel?.(msg.channel_id), g = ch?.guild_id ? T.findStore('GuildStore')?.getGuild?.(ch.guild_id) : null;
    const text = (T.plugins.get('MessageMenu')?.clean?.(msg) ?? msg.content ?? '').slice(0, 2000) || '(attachment)', page = pageId || this.cur().id;
    const note = { id: msg.id, page, channelId: msg.channel_id, guildId: ch?.guild_id || null, where: g ? `${g.name} › #${ch.name}` : ch?.name ? '#' + ch.name : 'Direct message',
      author: msg.author?.globalName || msg.author?.username || '?', text, sent: new Date(msg.timestamp || Date.now()).getTime(), at: Date.now() };
    T.ls.set('notes', [note, ...this.list().filter(n => n.id !== msg.id)].slice(0, this.MAX));
    T.notify('Saved to ' + (this.pages().find(p => p.id === page)?.name || 'Notes'), (note.text.length > 50 ? note.text.slice(0, 50) + '…' : note.text), 2000, 'success'); T.debug.refresh();
  },
  remove(id) { Twilight.ls.set('notes', this.list().filter(n => n.id !== id)); Twilight.debug.refresh(); },
  addPage() {
    const T = Twilight, ps = this.pages(); let n = ps.length + 1; while (ps.some(p => p.name === 'Page ' + n)) n++;
    const p = { id: Date.now().toString(36), name: 'Page ' + n }; T.ls.set('notePages', [...ps, p]); T.ls.set('notePage', p.id); this.renaming = p.id; T.debug.refresh();
  },
  rename(id, name) { const T = Twilight; name = String(name || '').trim().slice(0, 24); if (name) T.ls.set('notePages', this.pages().map(p => p.id === id ? { ...p, name } : p)); this.renaming = null; T.debug.refresh(); },
  dropPage(id) {
    const T = Twilight, ps = this.pages(); if (ps.length < 2) return;
    T.ls.set('notePages', ps.filter(p => p.id !== id)); T.ls.set('notes', this.list().filter(n => this.pageOf(n) !== id)); T.ls.set('notePage', ps.find(p => p.id !== id).id); T.debug.refresh();
  },
  tab: {
    name: 'Notes',
    render() {
      const T = Twilight, { h } = T, me = T.plugins.get('Notes'), ps = me.pages(), cur = me.cur(), list = me.list().filter(n => me.pageOf(n) === cur.id);
      // ---- page tabs: little tabs under the header; + adds a page, double-click renames, Delete page asks once more ----
      const tabStyle = on => `padding:5px 12px 6px;border-radius:6px 6px 0 0;cursor:pointer;font:600 13px var(--font-primary,"gg sans",sans-serif);white-space:nowrap;border:1px solid ${on ? 'var(--tw-line,rgba(255,255,255,.12))' : 'transparent'};border-bottom:0;margin-bottom:-1px;background:${on ? 'var(--tw-bg,#313338)' : 'transparent'};color:${on ? 'var(--tw-head,#fff)' : 'var(--tw-muted,#949ba4)'}`;
      const tabs = ps.map(p => {
        if (me.renaming === p.id) {
          const inp = h('input', { value: p.name, maxLength: 24, style: 'width:110px;padding:3px 6px;margin:1px 2px' });
          inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') me.rename(p.id, inp.value); if (e.key === 'Escape') { me.renaming = null; T.debug.refresh(); } };
          inp.onblur = () => me.rename(p.id, inp.value); setTimeout(() => { inp.focus(); inp.select(); }, 0);
          return inp;
        }
        const n = me.list().filter(x => me.pageOf(x) === p.id).length;
        return h('div', { textContent: n ? `${p.name} ${n}` : p.name, title: 'Double-click to rename', style: tabStyle(p.id === cur.id), onclick: () => { T.ls.set('notePage', p.id); T.debug.refresh(); }, ondblclick: () => { me.renaming = p.id; T.debug.refresh(); } });
      });
      const del = h('a', { textContent: 'Delete page', style: 'margin-left:auto;cursor:pointer;font-size:12px;color:var(--tw-muted,#949ba4);white-space:nowrap' });
      del.onclick = () => { if (Date.now() - (me.delArm || 0) > 3000) { me.delArm = Date.now(); del.textContent = list.length ? `Delete "${cur.name}" and its ${list.length} note${list.length > 1 ? 's' : ''}?` : `Delete "${cur.name}"?`; del.style.color = '#f23f43'; return; } me.delArm = 0; me.dropPage(cur.id); };
      const bar = h('div', { style: 'display:flex;align-items:flex-end;gap:2px;padding:0 2px;border-bottom:1px solid var(--tw-line,rgba(255,255,255,.12));margin:4px 0 10px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding-top:1px' },
        ...tabs, h('div', { textContent: '+', title: 'Add a note page', style: tabStyle(false) + ';font-size:15px;padding:3px 10px 5px', onclick: () => me.addPage() }), ...(ps.length > 1 ? [del] : []));
      // ---- the notes on this page ----
      const rows = list.map(n => {
        const when = new Date(n.sent).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
        const row = h('div', { className: 'twd-row', style: 'align-items:flex-start;cursor:default' },
          h('span', { style: 'min-width:0' }, h('b', { textContent: n.author, style: 'font-weight:600' }), h('small', { textContent: `${n.where} · ${when}` }),
            h('div', { textContent: n.text.length > 400 ? n.text.slice(0, 400) + '…' : n.text, style: 'margin-top:4px;white-space:pre-wrap;word-break:break-word;font-size:13px;opacity:.9' })),
          h('span', { style: 'display:flex;gap:10px;flex:none;padding-left:10px' },
            h('a', { textContent: 'Jump', style: 'cursor:pointer', onclick: () => { T.go(`/channels/${n.guildId || '@me'}/${n.channelId}/${n.id}`); T.debug.toggle?.(false); } }),
            h('a', { textContent: 'Copy', style: 'cursor:pointer', onclick: () => navigator.clipboard.writeText(n.text).then(() => T.notify('Copied', 'Note text', 1500, 'success')) }),
            h('a', { textContent: '✕', title: 'Remove this note', style: 'cursor:pointer', onclick: () => me.remove(n.id) })));
        row.dataset.find = (n.author + ' ' + n.where + ' ' + n.text).toLowerCase();
        return row;
      });
      const search = h('input', { placeholder: `Search ${cur.name}`, style: 'width:100%;box-sizing:border-box' });
      search.oninput = () => { const q = search.value.trim().toLowerCase(); for (const r of rows) r.style.display = !q || r.dataset.find.includes(q) ? '' : 'none'; };
      search.onkeydown = e => e.stopPropagation();
      return [bar, ...(list.length ? [search, ...rows] : [h('div', { className: 'twd-out', textContent: ps.length > 1 ? `Nothing on "${cur.name}" yet. Right-click a message > Save to Notes › ${cur.name}.` : 'No notes yet. Right-click any message and choose "Save to Notes".' })])];
    },
  },
  start() {
    const T = Twilight, me = this;
    me.off = T.ctx.add('Notes', t => {
      const li = t.closest?.('li[id^="chat-messages-"]'), msg = li && T.msgScan.info(li)?.msg; if (!msg) return null;
      if (me.has(msg.id)) return [{ label: 'Remove from Notes', icon: 'unnote', run: () => { me.remove(msg.id); T.notify('Notes', 'Removed', 1500, 'info'); } }];
      const ps = me.pages();
      return ps.length === 1 ? [{ label: 'Save to Notes', icon: 'note', run: () => me.save(msg, ps[0].id) }] : ps.slice(0, 6).map(p => ({ label: 'Save to Notes › ' + p.name, icon: 'note', run: () => me.save(msg, p.id) }));
    });
  },
  stop() { this.off?.(); },
});
