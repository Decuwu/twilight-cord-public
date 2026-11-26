// Top ^: a small button just above the right-hand end of the message box. Click it to jump to the very first message of the chat
// you are in (servers, DMs and threads). It asks Discord for the oldest message (one request, only when you click), then opens it
// the same way a message link does. Kept in place by the shared page watcher; nothing runs until you click.
Twilight.definePlugin({
  name: 'JumpToTop',
  added: '1.25.0',
  place: 'Channel',
  desc: 'A "Top ^" button above the message box jumps to the first message of the chat',
  vs: 'Reaching the first message means scrolling up for ages',
  start() {
    const T = Twilight, me = this;
    me.css = Object.assign(document.createElement('style'), { textContent:
      '.tw-top{position:absolute;right:10px;top:-24px;z-index:2;display:flex;align-items:center;gap:3px;height:20px;padding:0 8px;border-radius:10px;cursor:pointer;user-select:none;' +
      'font:600 12px/20px var(--font-primary,"gg sans",sans-serif);color:var(--interactive-normal,#b5bac1);background:var(--background-base-lower,var(--background-secondary,#2b2d31));border:1px solid var(--border-subtle,rgba(255,255,255,.06));box-shadow:0 1px 3px rgba(0,0,0,.25)}' +
      '.tw-top:hover{color:var(--interactive-hover,#dbdee1);background:var(--background-mod-normal,var(--background-modifier-hover,#35373c))}.tw-top.busy{opacity:.6;pointer-events:none}' });
    document.documentElement.append(me.css);
    const jump = async b => {
      const chId = T.findStore('SelectedChannelStore')?.getChannelId?.(); if (!chId) return;
      const ch = T.findStore('ChannelStore')?.getChannel?.(chId); b.classList.add('busy');
      try {
        me.firsts ||= new Map(); let first = me.firsts.get(chId);
        if (!first) { const r = await T.rest().get({ url: `/channels/${chId}/messages`, query: { after: '0', limit: 1 } }); first = Array.isArray(r?.body) ? r.body[r.body.length - 1] : null; if (first) me.firsts.set(chId, { id: first.id }); }
        if (!first) return T.notify('Top', 'This chat has no messages yet', 2500, 'info');
        // 1.25.0: Discord's own jumpToMessage loads the messages around the first one and scrolls there in one go. Changing the address
        // (the old way) sometimes only loaded them, so it took a second click to actually get there.
        const MA = me.ma ||= T.findByProps('jumpToMessage', 'fetchMessages');
        if (MA) MA.jumpToMessage({ channelId: chId, messageId: first.id, flash: true, jumpType: 'ANIMATED' });
        else T.go(`/channels/${ch?.guild_id || '@me'}/${chId}/${first.id}`);
      } catch (e) { T.notify('Top', 'Could not find the first message (' + (e?.status || e?.message || e) + ')', 3500, 'error'); }
      finally { b.classList.remove('busy'); }
    };
    const paint = () => {
      for (const box of document.querySelectorAll('main [class*="channelTextArea_"], [class*="chatContent_"] [class*="channelTextArea_"]')) {
        if (box.querySelector(':scope > .tw-top') || box.closest('[class*="sidebar"]')) continue;
        const b = document.createElement('div'); b.className = 'tw-top'; b.setAttribute('role', 'button'); b.tabIndex = 0; b.title = 'Jump to the first message';
        b.textContent = 'Top ^'; b.onclick = e => { e.preventDefault(); e.stopPropagation(); jump(b); };
        b.onmousedown = e => { e.preventDefault(); e.stopPropagation(); }; // keep focus where it is, so Discord does not redraw the box mid-click
        b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(b); } };
        if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
        box.append(b);
      }
    };
    me.off = T.onDom('JumpToTop', paint, 600); paint();
  },
  stop() { this.off?.(); document.querySelectorAll('.tw-top').forEach(n => n.remove()); this.css?.remove(); },
});
