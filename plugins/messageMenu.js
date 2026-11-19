// Right-click a message: copy as clean markdown, copy its link, remind me about it, see its edit history.
// Right-click a restored (deleted) or old edited message: hide it, or make it look like a normal message.
Twilight.definePlugin({
  name: 'MessageMenu',
  vs: 'Right-click gives copy text / copy link only: no clean markdown, reminders or edit history',
  desc: 'Right-click a message: copy as markdown / link, remind me, edit history',
  tab: {
    name: 'Reminders',
    render() {
      const { h } = Twilight, p = Twilight.plugins.get('MessageMenu'), list = Twilight.ls.get('reminders', []);
      const nodes = [h('div', { className: 'twd-sec', textContent: `Reminders (${list.length})` })];
      if (!list.length) nodes.push(h('div', { className: 'twd-out', textContent: 'None. Right-click a message and choose "Remind me about this".' }));
      for (const r of list.sort((a, b) => a.at - b.at)) nodes.push(h('div', { className: 'twd-row' },
        h('span', { onclick: () => p.go(r) }, `${new Date(r.at).toLocaleString([], { hour12: false })}  ${r.preview}`, h('small', { textContent: 'click to jump to the message' })),
        h('span', { textContent: '✕', onclick: e => { e.stopPropagation(); Twilight.ls.set('reminders', Twilight.ls.get('reminders', []).filter(x => x !== r && x.at !== r.at)); Twilight.debug.refresh(); } })));
      return nodes;
    },
  },
  go(r) {
    const path = `/channels/${r.guildId || '@me'}/${r.channelId}/${r.id}`;
    try { const R = Twilight.findByProps('transitionTo'); if (R) return R.transitionTo(path); } catch {}
    history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate'));
  },
  clean(msg) {
    const T = Twilight, US = T.findStore('UserStore'), CS = T.findStore('ChannelStore');
    let t = msg.content || '';
    t = t.replace(/<@!?(\d+)>/g, (_, id) => '@' + (US?.getUser?.(id)?.username || id)).replace(/<#(\d+)>/g, (_, id) => '#' + (CS?.getChannel?.(id)?.name || id))
      .replace(/<a?:(\w+):\d+>/g, ':$1:').replace(/<t:\d+(?::\w)?>/g, '');
    const files = (msg.attachments || []).map(a => a.url).filter(Boolean);
    return [t.trim(), ...files].filter(Boolean).join('\n');
  },
  start() {
    const T = Twilight, me = this;
    me.hist = new Map(); // message id -> older versions of its text (kept in memory only)
    const remember = m => { if (m?.id && !me.hist.has(m.id)) { me.hist.set(m.id, { now: m.content || '', old: [] }); if (me.hist.size > 2500) me.hist.delete(me.hist.keys().next().value); } };
    me.undo = T.onFlux({
      MESSAGE_CREATE: a => remember(a.message),
      LOAD_MESSAGES_SUCCESS: a => (a.messages || []).forEach(remember),
      MESSAGE_UPDATE: a => { const m = a.message, h = m && me.hist.get(m.id); if (h && m.content != null && m.content !== h.now) { h.old.push({ text: h.now, at: Date.now() }); h.now = m.content; } },
    }, 'MessageMenu');

    // reminders: checked every 20 s (one tiny storage read)
    me.stopTimer = T.every('MessageMenu', 20000, () => {
      const list = T.ls.get('reminders', []), now = Date.now(), due = list.filter(r => r.at <= now);
      if (!due.length) return;
      T.ls.set('reminders', list.filter(r => r.at > now));
      for (const r of due) T.notify('Reminder', r.preview, 12000, 'info');
      T.debug.refresh();
    });

    const link = (msg, ch) => `https://discord.com/channels/${ch?.guild_id || '@me'}/${msg.channel_id}/${msg.id}`;
    const openRemind = (info, msg) => {
      document.getElementById('tw-remind')?.remove();
      const box = T.h('div', { id: 'tw-remind' });
      box.style.cssText = 'position:fixed;z-index:2147483645;top:50%;left:50%;transform:translate(-50%,-50%);padding:14px;border-radius:12px;background:rgba(6,12,22,.95);backdrop-filter:blur(16px);border:1px solid rgba(108,200,255,.3);box-shadow:0 22px 60px rgba(0,0,0,.65);font:600 13px "Segoe UI",sans-serif;color:#d2e6f5;min-width:260px';
      const set = ms => {
        const ch = T.findStore('ChannelStore')?.getChannel?.(msg.channel_id);
        T.ls.set('reminders', [...T.ls.get('reminders', []), { at: Date.now() + ms, channelId: msg.channel_id, guildId: ch?.guild_id, id: msg.id, preview: `${msg.author?.username || '?'}: ${(me.clean(msg) || '(attachment)').slice(0, 70)}` }]);
        box.remove(); T.notify('Reminder set', `In ${ms >= 3600000 ? Math.round(ms / 360000) / 10 + ' h' : Math.round(ms / 60000) + ' min'}`, 2500, 'success');
      };
      const chip = (label, ms) => T.h('div', { className: 'twd-chip', textContent: label, onclick: () => set(ms), style: 'display:inline-block;margin:3px;padding:6px 10px;border-radius:14px;background:rgba(108,200,255,.16);cursor:pointer' });
      const mins = T.h('input', { placeholder: 'minutes', type: 'number', style: 'width:80px;margin-left:6px;padding:5px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.4);color:#fff' });
      const tm = new Date(); tm.setDate(tm.getDate() + 1); tm.setHours(9, 0, 0, 0);
      box.append(T.h('div', { textContent: 'Remind me about this message in', style: 'margin-bottom:8px;color:#b9ecff' }),
        chip('10 min', 600000), chip('1 hour', 3600000), chip('3 hours', 10800000), chip('Tomorrow 9am', tm - Date.now()),
        T.h('div', { style: 'margin-top:8px' }, 'Custom:', mins, chip('Set', 0)), T.h('div', { textContent: 'Cancel', style: 'margin-top:8px;color:#7f9bb5;cursor:pointer', onclick: () => box.remove() }));
      box.querySelector('div:nth-child(6) .twd-chip').onclick = () => +mins.value > 0 && set(+mins.value * 60000);
      document.body.append(box);
    };
    const showHistory = (msg) => {
      const h = me.hist.get(msg.id), lines = h ? [...h.old.map(o => `${new Date(o.at).toLocaleTimeString([], { hour12: false })}  ${o.text}`), `now  ${h.now}`] : [];
      document.getElementById('tw-hist')?.remove();
      const box = T.h('div', { id: 'tw-hist' });
      box.style.cssText = 'position:fixed;z-index:2147483645;top:50%;left:50%;transform:translate(-50%,-50%);width:min(440px,92vw);max-height:60vh;overflow:auto;padding:14px;border-radius:12px;background:rgba(6,12,22,.95);backdrop-filter:blur(16px);border:1px solid rgba(108,200,255,.3);box-shadow:0 22px 60px rgba(0,0,0,.65);font:13px "Segoe UI",sans-serif;color:#d2e6f5';
      box.append(T.h('div', { textContent: 'Edit history', style: 'font-weight:700;color:#b9ecff;margin-bottom:8px' }),
        T.h('div', { textContent: h?.old.length ? 'Versions seen since Discord loaded (oldest first):' : 'No edits were seen since Discord loaded. Edits made before then are not available.', style: 'color:#7f9bb5;margin-bottom:8px' }),
        ...lines.map(l => T.h('div', { textContent: l, style: 'padding:6px 8px;margin:3px 0;border-radius:6px;background:rgba(255,255,255,.05);white-space:pre-wrap' })),
        T.h('div', { textContent: 'Close', style: 'margin-top:8px;color:#7f9bb5;cursor:pointer', onclick: () => box.remove() }));
      document.body.append(box);
    };
    me.offCtx = T.ctx.add('MessageMenu', t => {
      const ghost = t.closest?.('.tw-ghost');
      if (ghost) return [
        { label: 'Remove this message', run: () => {
          const L = T.plugins.get('MessageLogger'), id = ghost.dataset.twId, at = +ghost.dataset.twAt;
          ghost.remove(); L?.ghosts?.delete(ghost);
          if (id && at) L?.drop({ at, id }); // out of the log and the saved copies too, so it does not come back
        } },
        { label: 'Make it look like a normal message', run: () => ghost.classList.add('tw-normal') },
      ];
      const li = t.closest?.('li[id^="chat-messages-"]'), info = li && T.msgScan.info(li), msg = info?.msg;
      if (!msg) return null;
      const ch = T.findStore('ChannelStore')?.getChannel?.(msg.channel_id), copy = (txt, what) => navigator.clipboard.writeText(txt).then(() => T.notify('Copied', what, 1800, 'success'), () => T.notify('Copy failed', what, 3000, 'error'));
      const out = [
        { label: 'Copy as clean markdown', run: () => copy(me.clean(msg), 'Message as markdown') },
        { label: 'Copy message link', run: () => copy(link(msg, ch), 'Message link') },
        { label: 'Remind me about this message', run: () => openRemind(info, msg) },
        { label: 'Translate this message', run: async () => {
          const el = li.querySelector('[id^="message-content-"]'), text = (el?.innerText || msg.content || '').trim(); if (!text) return;
          const to = T.opt('Translate', 'to', 'en'), r = await T.cmd({ type: 'translate', text, to }, 15000);
          if (!r || r.error || !r.text) return T.notify('Translate', 'Could not translate: ' + (r?.error || 'no reply'), 3500, 'error');
          el?.parentNode?.querySelector(':scope > .tw-tr')?.remove();
          const d = Object.assign(document.createElement('div'), { className: 'tw-tr', textContent: r.text }); d.style.cssText = 'font-size:12px;opacity:.7;margin-top:2px'; el?.after(d);
        } },
      ];
      if (me.hist.get(msg.id)?.old.length || msg.editedTimestamp || msg.edited_timestamp) out.push({ label: 'Edit history', run: () => showHistory(msg) });
      return out;
    });
  },
  stop() { this.undo?.(); this.stopTimer?.(); this.offCtx?.(); },
});
