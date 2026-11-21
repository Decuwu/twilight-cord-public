// A small "cut-out" label at the top, left of the inbox icon: "Twilight-Stable" (or PTB / Canary) opens the Twilight menu, and the version
// opens the changelog on the public GitHub.
Twilight.definePlugin({
  name: 'Build badge',
  vs: 'No label showing which Discord you are in',
  desc: 'Twilight-Stable / PTB / Canary and the version, left of the inbox icon: click the name for the menu, the version for the changelog',
  start() {
    const T = Twilight, me = this;
    const ch = String(window.GLOBAL_ENV?.RELEASE_CHANNEL || '').toLowerCase();
    const name = ch === 'ptb' ? 'PTB' : ch === 'canary' ? 'Canary' : ch === 'stable' ? 'Stable' : '';
    me.s = Object.assign(document.createElement('style'), { textContent: `
      .tw-badge { display: flex; align-items: center; gap: 6px; height: 20px; padding: 0 9px; margin-right: 10px; border-radius: 7px; white-space: nowrap;
        font: 600 11px/1 "gg sans","Segoe UI",sans-serif; letter-spacing: .02em; color: var(--text-muted,#80848e); cursor: default; user-select: none;
        background: rgba(0,0,0,.45); box-shadow: inset 0 1px 3px rgba(0,0,0,.85), inset 0 -1px 0 rgba(255,255,255,.07); }
      .tw-badge b, .tw-badge i { cursor: pointer; -webkit-app-region: no-drag; }
      .tw-badge b { font-weight: 700; color: var(--text-normal,#dbdee1); }
      .tw-badge i { font-style: normal; opacity: .85; }
      .tw-badge b:hover, .tw-badge i:hover { text-decoration: underline; opacity: 1; }
    ` });
    document.head.append(me.s);
    const CHANGELOG = 'https://github.com/Decuwu/twilight-cord-public/blob/main/CHANGELOG.md';
    const make = () => {
      const el = document.createElement('div'); el.className = 'tw-badge';
      const b = document.createElement('b'); b.textContent = 'Twilight' + (name ? '-' + name : ''); b.title = 'Open the Twilight menu';
      b.onclick = e => { e.stopPropagation(); T.debug?.toggle?.(true); };
      const i = document.createElement('i'); i.textContent = 'v' + (T.version || ''); i.title = 'What changed (opens the changelog on GitHub)';
      i.onclick = e => { e.stopPropagation(); window.open(CHANGELOG, '_blank'); };
      el.append(b, i); return el;
    };
    const put = () => {
      const ib = document.querySelector('[aria-label="Inbox"], [class*="recentsIcon"]'), tr = ib?.closest('[class*="trailing_"]') || document.querySelector('[class*="bar_"] [class*="winButtons"]')?.parentElement; if (!tr) return;
      let el = tr.querySelector(':scope > .tw-badge');
      if (el && tr.firstElementChild === el) return;
      if (!el) el = make();
      tr.prepend(el);
    };
    put(); me.stopDom = T.onDom('Build badge', put, 500);
  },
  stop() { try { this.stopDom?.(); } catch {} this.s?.remove(); document.querySelectorAll('.tw-badge').forEach(e => e.remove()); }
});
