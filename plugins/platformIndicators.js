// Small icons next to a name showing which device someone is on (desktop, phone, web), coloured by their status.
// Shown in chat message headers, the member list and the direct messages list. The icons are drawn here (no emoji).
Twilight.definePlugin({
  name: 'PlatformIndicators',
  heavy: true,
  vs: 'You cannot see which device someone is on',
  desc: 'Desktop / phone / web icons next to names in chat, the member list and DMs',
  options: [
    { key: 'messages', label: 'Show in chat (next to the name above a message)', def: true },
    { key: 'members', label: 'Show in the member list', def: true },
    { key: 'dms', label: 'Show in the direct messages list', def: true },
    { key: 'colour', label: 'Colour by status (green online, yellow idle, red do not disturb). Off = plain grey', def: true },
  ],
  start() {
    const T = Twilight, opt = (k, d = true) => T.opt('PlatformIndicators', k, d);
    // 24x24 outline icons, drawn for this mod.
    const PATH = {
      desktop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
      mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18h3"/>',
      web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 2.6 4 5.6 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.6-4-9s1.2-6.4 4-9z"/>',
    };
    const ORDER = ['desktop', 'web', 'mobile'], WORD = { desktop: 'desktop', mobile: 'phone', web: 'the web' };
    const COL = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43' }, STATE = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb' };

    this.css = Object.assign(document.createElement('style'), { textContent:
      '.tw-plat{display:inline-flex;align-items:center;gap:3px;margin-left:5px;vertical-align:middle;flex:none;line-height:0;cursor:default}' +
      '.tw-plat svg{width:14px;height:14px;display:block;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' });
    document.documentElement.append(this.css);

    const sigOf = uid => {
      const c = T.findStore('PresenceStore')?.getState?.()?.clientStatuses?.[uid]; if (!c) return '';
      return ORDER.filter(k => c[k]).map(k => k + ':' + c[k]).join(',');
    };
    const build = sig => {
      const el = document.createElement('span'); el.className = 'tw-plat'; el.dataset.sig = sig;
      const colour = opt('colour');
      el.innerHTML = sig.split(',').map(p => {
        const [k, st] = p.split(':');
        return `<svg viewBox="0 0 24 24" aria-label="${STATE[st] || 'Online'} on ${WORD[k]}" style="color:${colour ? COL[st] || COL.online : 'var(--text-muted,#949ba4)'}"><title>${STATE[st] || 'Online'} on ${WORD[k]}</title>${PATH[k]}</svg>`;
      }).join('');
      return el;
    };
    // Put (or refresh, or remove) the icons in `host`, right after `anchor` (or at the end of host).
    const place = (host, anchor, uid, on) => {
      if (!host) return false;
      const sig = on ? sigOf(uid) : '', old = host.querySelector(':scope > .tw-plat, :scope > * > .tw-plat');
      if (!sig) { old?.remove(); return false; }
      if (old && old.dataset.sig === sig && old.dataset.uid === uid && (old.parentElement === anchor?.parentElement || !anchor)) return true;
      old?.remove();
      const el = build(sig); el.dataset.uid = uid;
      if (anchor?.parentElement) anchor.after(el); else host.append(el);
      return true;
    };

    const stats = { headers: 0, headerIds: 0, members: 0, dms: 0, placed: 0 };
    // The presence store may not exist yet at start-up, so the change listener is hooked up the first time it is found.
    let kt = 0; const kick = () => { kt ||= setTimeout(() => { kt = 0; pass(); }, 2000); };
    const hook = () => { if (this.ps) return; const ps = T.findStore('PresenceStore'); if (ps?.addChangeListener) { ps.addChangeListener(kick); this.ps = ps; } };
    const pass = () => {
      if (document.hidden) return;
      hook();
      const m = opt('messages'), mem = opt('members'), dm = opt('dms'); let placed = 0, headers = 0, ids = 0, members = 0, dms = 0;
      // Chat: only the real header above a message (h3), never the small name shown in a reply preview.
      for (const h3 of document.querySelectorAll('li[id^="chat-messages-"] h3')) {
        headers++;
        const li = h3.closest('li'), name = h3.querySelector('[class*="username"]'); if (!name) continue;
        const mm = /^chat-messages-(\d+)-(\d+)$/.exec(li.id), uid = mm && T.findStore('MessageStore')?.getMessage?.(mm[1], mm[2])?.author?.id;
        if (uid) ids++;
        if (place(h3.querySelector('[class*="headerText"]') || h3, name, uid || '', m && !!uid)) placed++;
      }
      // Member list rows: data-list-item-id ends in the user id.
      for (const row of document.querySelectorAll('[data-list-item-id^="members"]')) {
        members++;
        const uid = (row.dataset.listItemId.match(/(\d{15,})$/) || [])[1], name = row.querySelector('[class*="name"]');
        const host = row.querySelector('[class*="nameAndDecorators"]') || name?.parentElement;
        if (uid && place(host, name?.parentElement === host ? name : null, uid, mem)) placed++;
      }
      // Direct messages list: one-to-one chats only (group chats have no single device to show).
      const CS = T.findStore('ChannelStore');
      for (const row of document.querySelectorAll('[data-list-item-id^="private-channels"]')) {
        dms++;
        const ch = CS?.getChannel?.((row.dataset.listItemId.match(/(\d{15,})$/) || [])[1]);
        if (!ch || ch.type !== 1) continue;
        const uid = ch.recipients?.[0], name = row.querySelector('[class*="name"]');
        const host = row.querySelector('[class*="nameAndDecorators"]') || name?.parentElement;
        if (uid && place(host, name?.parentElement === host ? name : null, uid, dm)) placed++;
      }
      stats.headers = headers; stats.headerIds = ids; stats.members = members; stats.dms = dms; stats.placed = placed;
    };
    pass();
    // Redraws are caught by the shared page watcher (at most 1.5 s apart); nothing runs while Discord is idle or minimised.
    this.stopT = T.onDom('PlatformIndicators', pass, 1500);
    // Someone changing status or device: redo the pass soon (cheap and throttled).
    this.kick = kick;
    this.onOpt = e => { if (e.detail?.plugin === 'PlatformIndicators') { document.querySelectorAll('.tw-plat').forEach(n => n.remove()); pass(); } };
    window.addEventListener('tw-opt', this.onOpt);
    // A small counts-only report (no names, no ids) so how it behaves on the live client can be checked without screenshots.
    const report = () => T.cmd?.({ type: 'report', name: 'platformindicators.json', text: JSON.stringify({ at: new Date().toISOString(), ...stats, presenceStore: !!this.ps, statusesKnown: Object.keys(this.ps?.getState?.()?.clientStatuses || {}).length }, null, 1) });
    this.rt = [setTimeout(report, 10000), setTimeout(report, 70000)];
  },
  stop() {
    this.stopT?.(); this.rt?.forEach(clearTimeout);
    this.ps?.removeChangeListener?.(this.kick); window.removeEventListener('tw-opt', this.onOpt);
    document.querySelectorAll('.tw-plat').forEach(n => n.remove()); this.css?.remove();
  },
});
