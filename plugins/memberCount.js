// MemberCount: a small line at the top of a server's member list with how many members it has and how many are online.
// The numbers come from Discord's own member-count store (no requests). Updated only when Discord redraws the list.
Twilight.definePlugin({
  name: 'MemberCount',
  added: '1.25.0',
  place: 'Servers',
  desc: 'Shows the member and online count above a server\'s member list',
  vs: 'The member list never says how many people are in the server',
  start() {
    const T = Twilight, me = this, fmt = n => Number(n).toLocaleString();
    me.css = Object.assign(document.createElement('style'), { textContent:
      '.tw-mc{display:flex;gap:12px;align-items:center;white-space:nowrap;padding:16px 8px 0 16px;font:600 12px/16px var(--font-primary,"gg sans",sans-serif);letter-spacing:.02em;text-transform:uppercase;color:var(--channels-default,#949ba4)}' +
      '.tw-mc i{display:inline-block;width:8px;height:8px;margin-right:5px;border-radius:50%;vertical-align:0}.tw-mc .all i{background:var(--interactive-muted,#80848e)}.tw-mc .on i{background:var(--status-positive,#23a55a)}' });
    document.documentElement.append(me.css);
    const paint = () => {
      // Inside the scrolling list, above the first group (the panel itself lays its children out side by side).
      const wrap = document.querySelector('[class*="membersWrap_"] [role="list"]'), gid = T.findStore('SelectedGuildStore')?.getGuildId?.();
      if (!wrap || !gid) return;
      const S = T.findStore('GuildMemberCountStore'), all = S?.getMemberCount?.(gid), on = S?.getOnlineCount?.(gid); if (all == null) return;
      let el = wrap.querySelector(':scope > .tw-mc');
      if (!el) { el = document.createElement('div'); el.className = 'tw-mc'; el.innerHTML = '<span class="all"><i></i><b></b></span><span class="on"><i></i><b></b></span>'; wrap.prepend(el); }
      const a = `${fmt(all)} member${all === 1 ? '' : 's'}`, o = on == null ? '' : `${fmt(on)} online`;
      const [ba, bo] = el.querySelectorAll('b'); if (ba.textContent !== a) ba.textContent = a; if (bo.textContent !== o) bo.textContent = o; el.querySelector('.on').style.display = o ? '' : 'none';
    };
    me.off = T.onDom('MemberCount', paint, 1000); paint();
  },
  stop() { this.off?.(); document.querySelectorAll('.tw-mc').forEach(n => n.remove()); this.css?.remove(); },
});
