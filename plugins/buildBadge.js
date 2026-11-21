// A small "cut-out" label at the top, left of the inbox icon: which Discord this is (Stable / PTB / Canary) and the Twilight version.
Twilight.definePlugin({
  name: 'Build badge',
  vs: 'No label showing which Discord you are in',
  desc: 'Shows Stable / PTB / Canary and the Twilight version, left of the inbox icon',
  start() {
    const T = Twilight, me = this;
    const ch = String(window.GLOBAL_ENV?.RELEASE_CHANNEL || '').toLowerCase();
    const name = ch === 'ptb' ? 'PTB' : ch === 'canary' ? 'Canary' : ch === 'stable' ? 'Stable' : '';
    me.s = Object.assign(document.createElement('style'), { textContent: `
      .tw-badge { display: flex; align-items: center; gap: 6px; height: 20px; padding: 0 9px; margin-right: 10px; border-radius: 7px; white-space: nowrap;
        font: 600 11px/1 "gg sans","Segoe UI",sans-serif; letter-spacing: .02em; color: var(--text-muted,#80848e); cursor: default; user-select: none;
        background: rgba(0,0,0,.45); box-shadow: inset 0 1px 3px rgba(0,0,0,.85), inset 0 -1px 0 rgba(255,255,255,.07); }
      .tw-badge b { font-weight: 700; color: var(--text-normal,#dbdee1); }
      .tw-badge i { font-style: normal; opacity: .85; }
    ` });
    document.head.append(me.s);
    const text = () => `${name ? `<b>${name}</b>` : ''}<i>v${T.version || ''}</i>`;
    const put = () => {
      const ib = document.querySelector('[aria-label="Inbox"], [class*="recentsIcon"]'), tr = ib?.closest('[class*="trailing_"]') || document.querySelector('[class*="bar_"] [class*="winButtons"]')?.parentElement; if (!tr) return;
      let el = tr.querySelector(':scope > .tw-badge');
      if (el && tr.firstElementChild === el) return;
      if (!el) { el = document.createElement('div'); el.className = 'tw-badge'; el.innerHTML = text(); el.title = `Twilight-Cord v${T.version || ''}${name ? ' on Discord ' + name : ''}`; }
      tr.prepend(el);
    };
    put(); me.stopDom = T.onDom('Build badge', put, 500);
  },
  stop() { try { this.stopDom?.(); } catch {} this.s?.remove(); document.querySelectorAll('.tw-badge').forEach(e => e.remove()); }
});
