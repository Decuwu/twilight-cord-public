// First-run tip: points a small bouncing "click me" arrow at the Twilight label at the top of Discord and shows the menu key.
// Only for fresh installs (decided once, like the menu key default), so people who already use the menu never see it uninvited.
// It goes away once the menu has been opened (by the label, the key or the card), or after 3 launches. Replay: Twilight menu > Settings > Menu.
Twilight.definePlugin({
  name: 'Welcome hint',
  vs: 'No first-run tip about where the Twilight menu is',
  desc: 'First launch only: a "click me" arrow at the Twilight label and the menu key. Goes away once you open the menu',
  start() {
    const T = Twilight, me = this;
    let st = T.ls.get('welcome');
    if (!st) { st = T.ls.fresh() ? 'pending' : 'skip'; T.ls.set('welcome', st); if (st === 'pending') T.ls.set('welcomeN', 0); }
    me.show = () => { // also used by the replay button
      if (me.el) return;
      const root = document.createElement('div'); root.className = 'tw-wlc';
      root.innerHTML = `
        <div class="tw-wlc-arrow"><span>click me</span>
          <svg viewBox="0 0 40 52" width="34" height="44" aria-hidden="true"><path d="M8 50 C 4 34, 12 20, 28 9" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M14 6 L 30 7 L 25 22" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="tw-wlc-card">
          <b>Twilight is installed</b>
          <p>Click <u>Twilight</u> up here, or press <kbd></kbd>, to open its menu.</p>
          <div class="tw-wlc-btns"><button data-a="open">Open menu</button><button data-a="skip">Got it</button></div>
        </div>`;
      me.el = root;
      root.addEventListener('click', e => {
        const a = e.target.closest('button')?.dataset.a; if (!a) return;
        e.stopPropagation();
        if (a === 'open') T.debug?.toggle?.(true); else me.done();
      });
      document.body.append(root);
      me.paint(); me.place();
    };
    me.paint = () => { // the key can be changed in the menu: always show the current one
      const k = me.el?.querySelector('kbd'); if (k) k.textContent = T.debug?.keyName?.(T.debug.key) || String(T.debug?.key || '');
      document.querySelector('.tw-badge')?.classList.add('tw-pulse');
    };
    me.place = () => {
      const el = me.el, b = document.querySelector('.tw-badge b'); if (!el) return;
      if (!b) { el.style.visibility = 'hidden'; return; } // the label is not on screen (yet)
      const r = b.getBoundingClientRect(), w = 250, left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - 60));
      el.style.cssText = `visibility:visible;left:${left}px;top:${Math.round(r.bottom + 4)}px;width:${w}px;--ax:${Math.round(r.left + r.width / 2 - left)}px`;
      document.querySelector('.tw-badge')?.classList.add('tw-pulse');
    };
    me.done = () => { // seen: never show again
      if (T.ls.get('welcome') !== 'done') T.ls.set('welcome', 'done');
      me.hide();
    };
    me.hide = () => { me.el?.remove(); me.el = null; document.querySelectorAll('.tw-pulse').forEach(e => e.classList.remove('tw-pulse')); };
    T.welcome = { show: () => { T.ls.set('welcome', 'pending'); me.show(); }, done: () => me.done(), active: () => !!me.el };
    me.s = Object.assign(document.createElement('style'), { textContent: `
      .tw-wlc { position: fixed; z-index: 99999; visibility: hidden; pointer-events: none; font: 500 13px/1.4 "gg sans","Segoe UI",sans-serif; color: var(--text-normal,#dbdee1); }
      .tw-wlc-arrow { position: absolute; left: calc(var(--ax) - 52px); top: 0; display: flex; align-items: flex-start; gap: 2px; color: var(--brand-500,#7289da);
        animation: tw-wlc-bob 1.1s ease-in-out infinite; }
      .tw-wlc-arrow span { margin-top: 24px; font: 700 14px/1 "gg sans","Segoe UI",sans-serif; letter-spacing: .02em; white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,.6); transform: rotate(-6deg); }
      .tw-wlc-arrow svg { transform: scaleX(-1); filter: drop-shadow(0 1px 2px rgba(0,0,0,.6)); }
      .tw-wlc-card { position: absolute; left: 0; top: 58px; width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 10px; pointer-events: auto;
        background: var(--background-floating,#111214); border: 1px solid rgba(255,255,255,.08); box-shadow: 0 8px 24px rgba(0,0,0,.45); }
      .tw-wlc-card b { display: block; font-size: 14px; font-weight: 700; margin-bottom: 4px; color: var(--header-primary,#f2f3f5); }
      .tw-wlc-card p { margin: 0 0 10px; color: var(--text-muted,#b5bac1); }
      .tw-wlc-card u { text-decoration: none; color: var(--text-normal,#dbdee1); font-weight: 600; }
      .tw-wlc-card kbd { font: 600 12px/1 "gg mono",Consolas,monospace; padding: 2px 6px; border-radius: 5px; color: var(--text-normal,#dbdee1); background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); border-bottom-width: 2px; }
      .tw-wlc-btns { display: flex; gap: 8px; }
      .tw-wlc-btns button { flex: 1; height: 28px; border: 0; border-radius: 6px; cursor: pointer; font: 600 12px/1 inherit; color: var(--text-normal,#dbdee1); background: rgba(255,255,255,.08); }
      .tw-wlc-btns button:hover { background: rgba(255,255,255,.14); }
      .tw-wlc-btns button[data-a="open"] { color: #fff; background: var(--brand-500,#5865f2); }
      .tw-wlc-btns button[data-a="open"]:hover { filter: brightness(1.1); background: var(--brand-500,#5865f2); }
      .tw-badge.tw-pulse { animation: tw-wlc-ring 1.8s ease-out infinite; }
      @keyframes tw-wlc-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
      @keyframes tw-wlc-ring { 0% { box-shadow: inset 0 1px 3px rgba(0,0,0,.85), 0 0 0 0 rgba(114,137,218,.7); } 80%,100% { box-shadow: inset 0 1px 3px rgba(0,0,0,.85), 0 0 0 9px rgba(114,137,218,0); } }
      @media (prefers-reduced-motion: reduce) { .tw-wlc-arrow, .tw-badge.tw-pulse { animation: none; } }
    ` });
    document.head.append(me.s);
    if (st === 'pending') {
      const n = (T.ls.get('welcomeN') || 0) + 1; T.ls.set('welcomeN', n);
      if (n > 3) me.done(); else { me.show(); }
    }
    me.stopDom = T.onDom('Welcome hint', () => { if (me.el) { me.place(); me.paint(); } }, 300);
    me.rs = () => me.place(); window.addEventListener('resize', me.rs);
  },
  stop() { try { this.stopDom?.(); } catch {} window.removeEventListener('resize', this.rs); this.hide?.(); this.s?.remove(); delete Twilight.welcome; }
});
